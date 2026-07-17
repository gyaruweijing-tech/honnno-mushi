# 📝 PROGRESS — honnno-mushi 開発記録

このファイルは、プロジェクトの経緯・設計思想・実装状況をまとめた開発記録です。
他の AI や開発者がこのプロジェクトを引き継ぐ際の参考資料として機能します。

---

## 🎯 プロジェクト概要

**honnno-mushi（本の虫）** は、あとで読みたい記事や X のポスト等の URL を
ブックマーク的に保存・管理する個人用 PWA アプリです。

### なぜ作ったか

- 開発者（ユーザー）が AI ツール「Google Antigravity」の学習を兼ねて、
  実践的なアプリを作りたかった
- 記事や URL を「あとで読む」リストとして管理するシンプルなツールが欲しかった
- PWA として作り、スマホのホーム画面から使えるようにしたかった

### 基本コンセプト

1. **URL を保存** → OGP（Open Graph Protocol）でタイトル・サムネイル・説明文を自動取得
2. **カード型で一覧表示** → タグ・ステータス・お気に入りで整理
3. **タップで元記事に飛ぶ** → アプリ内で記事を表示するのではなく、元 URL を開く
4. **完全無料** — 外部 DB・API キー一切不要
5. **プライバシー安全** — GitHub に public で出しても問題なし（秘密情報ゼロ）

---

## 🏗 設計判断の記録

### ストレージ: IndexedDB（Dexie.js）を選んだ理由

| 候補 | 採用 | 理由 |
|---|---|---|
| localStorage | ❌ | 5MB制限、文字列のみ、構造化データに弱い |
| **IndexedDB (Dexie.js)** | **✅** | 構造化データ対応、容量十分、オフライン完全対応、無料 |
| Firebase Firestore | ❌ | 同期不要（1デバイス完結）なのでオーバーキル |

- ユーザーの要件：「同期不要、1 デバイスで完結、完全オフライン OK」
- Dexie.js は IndexedDB のラッパーで、Promise ベースの使いやすい API を提供

### OGP 取得: Vercel Serverless Functions を選んだ理由

- ブラウザから直接他サイトの HTML を fetch すると **CORS** でブロックされる
- → サーバーサイドでプロキシする必要がある
- Vercel Serverless Functions は Next.js の API Routes として自然に書ける
- Vercel Hobby プラン（無料）で十分な呼び出し回数
- 外部 API キー不要。cheerio で HTML をパースするだけ

### フレームワーク: Next.js を選んだ理由

- Vercel との相性が抜群（push するだけで自動デプロイ）
- App Router で API Routes（Serverless Functions）が自然に書ける
- TypeScript サポートが標準

### スタイリング: Vanilla CSS (CSS Modules) を選んだ理由

- Tailwind 等のユーティリティ CSS は使わず、CSS 変数でデザインシステムを構築
- CSS Modules でコンポーネントスコープのスタイルを実現
- 外部依存なしで軽量

### セキュリティ: GitHub public で問題ない理由

- DB パスワード・接続キー → **存在しない**（IndexedDB はブラウザ内蔵）
- API キー・シークレット → **存在しない**（OGP 取得は公開 URL を fetch するだけ）
- 環境変数（.env） → **不要**
- ユーザーの個人データ → **リポジトリに含まれない**（ブラウザ内のみ）

---

## 📊 データモデル

```typescript
interface Bookmark {
  id: string;           // UUID v4
  url: string;          // 保存した URL
  title: string;        // ページタイトル（OGP 自動取得 or 手動）
  description: string;  // ページ説明文（OGP 自動取得）
  thumbnail: string;    // OG 画像の URL
  tags: string[];       // タグ（例: ["tech", "design"]）
  status: "unread" | "read";  // 未読 / 読了
  starred: boolean;     // お気に入り
  memo: string;         // 個人メモ
  createdAt: number;    // 作成日時（Unix timestamp）
  updatedAt: number;    // 更新日時（Unix timestamp）
}
```

---

## 📁 ファイル構成と役割

### コア（`src/lib/`）

| ファイル | 役割 |
|---|---|
| `db.ts` | Dexie.js で IndexedDB をセットアップ。Bookmark インターフェース定義 |
| `bookmarks.ts` | CRUD 関数群: add, getAll, update, delete, toggleStar, toggleStatus |

### API（`src/app/api/`）

| ファイル | 役割 |
|---|---|
| `ogp/route.ts` | Vercel Serverless Function。URL を受け取り、HTML を fetch して OGP メタタグ（og:title, og:description, og:image）を cheerio でパース。5 秒タイムアウト付き |

### カスタムフック（`src/hooks/`）

| ファイル | 役割 |
|---|---|
| `useBookmarks.ts` | React hook。全ブックマーク取得、フィルタリング（検索・ステータス・タグ・スター）、CRUD ラッパー。変更後に自動リフレッシュ |

### コンポーネント（`src/components/`）

| コンポーネント | 役割 |
|---|---|
| `BookmarkCard/` | カード型表示。サムネイル、タイトル、URL ドメイン、タグチップ、スターボタン、ステータスバッジ。ホバーで浮き上がるアニメーション |
| `AddBookmarkModal/` | URL 追加モーダル。URL 入力 → OGP 自動取得 → プレビュー → タグ・メモ入力 → 保存 |
| `BookmarkDetail/` | 詳細・編集モーダル。全情報表示、インライン編集、削除（確認付き）、ステータス・スター切替 |
| `FilterBar/` | 検索バー + ステータスフィルター（ピル型ボタン）+ スターフィルター + タグドロップダウン。スティッキー + backdrop-filter |

### ページ・レイアウト（`src/app/`）

| ファイル | 役割 |
|---|---|
| `page.tsx` | メインページ。FilterBar + カードグリッド + FAB（追加ボタン）+ 各モーダルを統合 |
| `page.module.css` | グラデーションヘッダー、レスポンシブグリッド（1/2/3列）、アニメーション付き FAB |
| `layout.tsx` | ルートレイアウト。PWA メタデータ、viewport、テーマカラー |
| `globals.css` | デザインシステム。CSS 変数（色、シャドウ、角丸、フォント、スペーシング、トランジション）、リセット、アニメーション |

### PWA（`public/`）

| ファイル | 役割 |
|---|---|
| `manifest.json` | PWA マニフェスト。アプリ名、アイコン、テーマカラー、standalone 表示 |
| `icon-192.png` | 192x192 アプリアイコン（メガネをかけた本の虫デザイン） |
| `icon-512.png` | 512x512 アプリアイコン |

---

## ✅ 実装済み機能

- [x] URL 保存（手動入力 + ペースト対応）
- [x] OGP 自動取得（タイトル、説明文、サムネイル）
- [x] カード型一覧表示（レスポンシブグリッド）
- [x] タグ付け（複数タグ、チップ型 UI）
- [x] 未読 / 読了 ステータス管理
- [x] お気に入り（スター）機能
- [x] メモ機能
- [x] キーワード検索
- [x] ステータスフィルター
- [x] タグフィルター
- [x] スターフィルター
- [x] ブックマーク編集（タイトル、タグ、メモ）
- [x] ブックマーク削除（確認ダイアログ付き）
- [x] PWA マニフェスト + アイコン
- [x] ライトモード UI（コーラル & ティール配色）
- [x] レスポンシブデザイン（モバイルファースト）
- [x] GitHub リポジトリ作成 + Vercel 自動デプロイ

## 🔮 未実装・今後の改善案

- [ ] Service Worker によるオフラインキャッシュ
- [ ] データのエクスポート / インポート（JSON）
- [ ] ダークモード対応
- [ ] ドラッグ & ドロップで並び替え
- [ ] ブックマークのソート（日付順、タイトル順）
- [ ] 一括操作（複数選択 → 削除、タグ付け）
- [ ] ブラウザの「共有」機能からの URL 追加（Web Share Target API）
- [ ] 読書統計ダッシュボード

---

## 🔧 開発環境

- **OS**: Windows
- **AI ツール**: Google Antigravity（Claude Opus 4.6 モデル使用）
- **パッケージマネージャ**: npm
- **Node.js**: ローカル環境
- **デプロイ先**: Vercel (Hobby プラン・無料)
- **リポジトリ**: https://github.com/gyaruweijing-tech/honnno-mushi

---

## 📅 開発タイムライン

### 2026-07-16 — プロジェクト開始 & 初版完成

1. **設計フェーズ**: ユーザーと対話で要件を詰めた
   - アプリ名を「honnno-mushi（本の虫）」に決定
   - ストレージは IndexedDB（同期不要、完全無料）
   - OGP 自動取得は Vercel Serverless Functions 経由
   - フレームワークは Next.js（Vercel との相性重視）
   - コスト・セキュリティ面の懸念を全て解消
2. **実装フェーズ**: Next.js プロジェクト初期化 → 全コンポーネント実装
3. **デプロイフェーズ**: GitHub CLI でリポジトリ作成 → Vercel 自動デプロイ
4. **改善**: PWA アイコン画像を生成・設定
5. **動作確認**: スマホからのアクセス＆ホーム画面追加を確認

---

## 🔜 次のステップ: Firebase（クラウド DB）への移行計画

### ステータス: **検討中（ユーザーが学習・検討中）**

現在は IndexedDB（ブラウザ内蔵 DB）を使っているが、
**Firebase Firestore（クラウド DB）** に移行することで、
スマホと PC 間でデータを同期できるようにする計画がある。

### なぜ移行したいか

- 現状: データは 1 つのブラウザにしか存在しない
- 目標: どのデバイスからでも同じブックマークにアクセスしたい
- 副次目標: DB の仕組みを学習したい

### 移行で何が変わるか

```
現在（IndexedDB）:
  スマホの Safari → [ブラウザ内 DB] ← データはここだけ
  PC の Chrome   → [ブラウザ内 DB] ← 別のデータ（同期しない）

移行後（Firebase Firestore）:
  スマホの Safari → [Firebase クラウド DB] ← 同じデータ！
  PC の Chrome   →          ↑              ← 同じデータ！
```

### 技術的な計画

#### 追加するもの

| 項目 | 技術 | 説明 |
|---|---|---|
| クラウド DB | Firebase Firestore | Google のリアルタイム NoSQL DB。無料枠で十分 |
| 認証 | Firebase Auth（Google ログイン） | 「誰のデータか」を識別するために必要 |
| Context | React Context（AuthContext） | 認証状態をアプリ全体で共有 |

#### 変更するファイル（2 ファイルだけ差し替え）

現在の設計では、データ操作が `src/lib/db.ts` と `src/lib/bookmarks.ts` に集約されている。
この 2 ファイルを Firestore 版に書き換えるだけで、UI コンポーネントは一切変更不要。

```
変更前: useBookmarks → bookmarks.ts → IndexedDB (Dexie.js)
変更後: useBookmarks → bookmarks.ts → Firebase Firestore
                        ↑ ここだけ差し替え
```

これが可能なのは、初期設計で **データ層と UI 層を分離** していたため。

#### 新規追加するファイル

| ファイル | 役割 |
|---|---|
| `src/lib/firebase.ts` | Firebase アプリ初期化、Firestore / Auth インスタンス |
| `src/lib/auth.ts` | Google ログイン / ログアウト関数 |
| `src/hooks/useAuth.ts` | 認証状態管理フック |
| `src/contexts/AuthContext.tsx` | 認証状態をアプリ全体で共有する Context |
| `src/components/AuthGuard/` | 未ログイン時のログイン画面 |
| `.env.local` | Firebase 設定値（.gitignore 対象） |

#### Firestore データ構造

```
users/
  └── {userId}/
        └── bookmarks/
              ├── {bookmarkId}: { url, title, tags, status, ... }
              ├── {bookmarkId}: { ... }
              └── ...
```

#### セキュリティルール（Firestore）

```
match /users/{userId}/bookmarks/{bookmarkId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
```
→ 自分のデータだけ読み書き可能。他人のデータは絶対にアクセスできない。

### ユーザーが手動で行う作業

1. Firebase コンソール (https://console.firebase.google.com) でプロジェクト作成
2. Authentication → Google プロバイダーを有効化
3. Firestore Database を作成
4. ウェブアプリを追加 → 設定値を取得
5. Vercel ダッシュボードに環境変数を設定

### 安全性

| 懸念 | 回答 |
|---|---|
| 費用 | Firebase Spark プラン（無料）。クレカ登録不要 |
| API キー漏洩 | Firebase API キーはプロジェクト識別子であり秘密情報ではない |
| 個人情報 | 保存するのは URL とメモだけ。Google ログインでは UID のみ使用 |
| データ安全性 | セキュリティルールで自分のデータのみアクセス可能 |

### 未決定事項

- [ ] 既存の IndexedDB データを Firebase に移行するか、新規スタートするか
- [ ] 実施タイミング（ユーザーが学習完了後に着手予定）

---

## 🎨 UI 拡張方針

今後 UI をどんどん改良しやすくするために、以下の設計方針を採用する予定：

```
src/
├── contexts/          ← アプリ全体の状態管理（認証、テーマ等）
├── hooks/             ← ロジックの再利用（データ操作）
├── components/        ← UI の部品（見た目だけ担当）
└── app/
    └── page.tsx       ← 組み立てだけ、ロジックは hooks/contexts に委譲
```

この分離により：
- **新 UI コンポーネント追加** → `components/` にファイル追加するだけ
- **データ取得方法の変更** → `hooks/` だけ変更、UI はそのまま
- **新ページ追加** → `app/` にルート追加、既存 hooks/components を再利用

---

*最終更新: 2026-07-17*
