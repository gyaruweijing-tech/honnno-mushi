import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// dns を使うので Node.js で動かす
export const runtime = 'nodejs';

const MAX_REDIRECTS = 3;
const MAX_BYTES = 1_000_000; // 読むのは先頭 1MB まで（OGP は <head> にある）

// サーバーを踏み台にされないよう、内部ネットワーク・自分自身の住所には取りに行かない（SSRF 対策）
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return (
    v6 === '::' || v6 === '::1' ||
    v6.startsWith('fc') || v6.startsWith('fd') ||
    v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb')
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('blocked');
  if (url.username || url.password) throw new Error('blocked');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('blocked');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error('blocked');
  return url;
}

async function readLimited(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'url parameter is required' },
      { status: 400 }
    );
  }

  let current: URL;
  try {
    current = await assertPublicUrl(targetUrl);
  } catch {
    return NextResponse.json(
      { error: 'Invalid or blocked URL' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // リダイレクトは自分でたどり、行き先を毎回確かめる
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetch(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; honnno-mushi/1.0; +https://honnno-mushi.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        current = await assertPublicUrl(new URL(location, current).href);
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response?.status ?? 'redirect'}` },
        { status: 502 }
      );
    }

    const html = await readLimited(response);
    clearTimeout(timeout);
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // 相対パスの画像を解決。http(s) 以外は捨てる
    try {
      image = image ? new URL(image, current).href : '';
      if (!/^https?:/.test(image)) image = '';
    } catch {
      image = '';
    }

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
    });
  } catch {
    // 内部のエラー文はそのまま返さない
    return NextResponse.json(
      { error: 'Failed to fetch OGP' },
      { status: 502 }
    );
  }
}
