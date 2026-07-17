# 🐛 honnno-mushi — あなたのリーディングリスト

URLを保存してカード型で一覧表示し、タップで元記事に飛んで読む、個人用リーディングリスト PWA。

## ✨ 特徴

- **URL保存 → カード表示** — URLを貼るだけでタイトル・サムネイル・説明文を自動取得（OGP）
- **タグ・ステータス管理** — タグ付け、未読/読了、お気に入り⭐で整理
- **検索・フィルター** — キーワード検索、ステータス別、タグ別の絞り込み
- **PWA対応** — スマホのホーム画面に追加してネイティブアプリのように使える
- **完全無料・オフライン対応** — データはブラウザ内のIndexedDBに保存。外部DB不要
- **プライバシー安全** — APIキーもクラウドDBも一切なし。データは端末内のみ

## 🛠 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Vanilla CSS (CSS Modules) |
| ストレージ | IndexedDB (Dexie.js) |
| OGP取得 | Vercel Serverless Functions + cheerio |
| デプロイ | Vercel |

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── api/ogp/route.ts      # OGP取得 Serverless Function
│   ├── globals.css            # デザインシステム（CSS変数）
│   ├── layout.tsx             # ルートレイアウト（PWA設定）
│   ├── page.tsx               # メインページ
│   └── page.module.css        # メインページスタイル
├── components/
│   ├── AddBookmarkModal/      # URL追加モーダル
│   ├── BookmarkCard/          # カード型ブックマーク表示
│   ├── BookmarkDetail/        # 詳細・編集モーダル
│   └── FilterBar/             # 検索・フィルターバー
├── hooks/
│   └── useBookmarks.ts        # ブックマーク管理カスタムフック
└── lib/
    ├── db.ts                  # IndexedDB セットアップ（Dexie）
    └── bookmarks.ts           # CRUD ヘルパー関数
```

## 🚀 ローカル開発

```bash
npm install
npm run dev
# http://localhost:3000 で開く
```

## 📦 デプロイ

GitHub に push するだけで Vercel が自動デプロイします。

## 📄 ライセンス

MIT
