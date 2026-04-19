# Bookshelf (Share Site)

Next.js + Tailwind CSS + TypeScript のみで構成しています（バックエンドなし）。

## 使い方

```bash
npm install
npm run dev
```

開発サーバー: `http://localhost:3000`

※ ダーク/ライトはOS（ブラウザ）の設定に追従します（切り替えボタンはありません）。

## 本データの差し替え

- `books.json` を編集してください（このサイトの唯一のデータソースです）。
- 画像は `public/` 配下に置き、`coverImage` には `"/covers/xxx.svg"` のように指定します。
- 詳細記事（任意）を付けたい場合は、Markdownファイルを作って `article` にパスを入れます。
  - 例: `content/books/b-001.md` を作り、`"article": "content/books/b-001.md"` のように指定

`books.json` の項目:

- `id`, `title`, `author`, `coverImage`, `tags`, `shelf`, `rating`, `finishedOn`, `article?`
- `shelf` は `"jp" | "foreign"`（和書/洋書の2分類）
- `rating` は `0`〜`5`（0 は未評価扱いでもOK）
- `finishedOn` は `YYYY-MM-DD`（表示は `YYYY/MM/DD`）

## ファイル構成（主要）

- `src/app/page.tsx` トップページ（本一覧）
- `src/components/books/*` 本カード / フィルターUI
- `src/components/theme/*` ダークモード切り替え
- `src/components/shell/TopBar.tsx` 上部バー（名前/導線）
- `src/lib/books.ts` `books.json` の読み込み
- `books.json` 本データ
- `public/covers/*` ダミー表紙（SVG）

雰囲気（配色/棚っぽい背景/文字組み）は `src/app/globals.css` の CSS 変数で調整できます。

## Vercel デプロイ想定

1. GitHub に push
2. Vercel で Import
3. Framework Preset は **Next.js**
4. Build Command: `npm run build`（デフォルト）
5. Output は自動（`next build` / `next start`）

環境変数は不要です。
