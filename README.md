<p align="center">
  <img src="public/icon.png" alt="LexRamus" width="120" />
</p>

<h1 align="center">LexRamus</h1>

<p align="center">e-Gov法令APIを使った法令ビューアー</p>

<p align="center">
  <a href="https://ykshio.github.io/lexramus/">https://ykshio.github.io/lexramus/</a>
</p>

---

## 機能

- **法令検索** — 法令名で検索、法令種別フィルタ
- **ツリービュー** — 編・章・節・款・目・条・項・号の階層表示
- **アウトラインビュー** — フラットな縦アウトライン表示
- **展開レベル制御** — ボタンで指定階層まで一括展開
- **目次パネル** — 構造単位の一覧、クリックでジャンプ
- **色タグ** — 条文に6色のマーカーを付与、フィルタ表示（localStorage永続化）
- **過去法令の遡及** — 日付指定で任意時点の法令を表示、改正履歴一覧
- **URL共有** — 法令ID・時点をURLパラメータに反映
- **キーボードショートカット** — `/` 検索、`t` ビュー切替、`c` 目次、`1`-`7` 展開レベル

## 技術スタック

React + TypeScript + Vite + Tailwind CSS + Zustand

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

`dist/` に静的ファイルが生成されます。

## デプロイ

### GitHub Pages（開発環境）

```bash
npm run build
git add .
git commit -m "Update"
git push
```

GitHub Actions が自動的に GitHub Pages にデプロイします。
確認：https://ykshio.github.io/lexramus/

### さくらのレンタルサーバー（本番環境）

```bash
npm run build
```

GitHub リポジトリ → **Actions** タブ → **Deploy to Sakura Server** → **Run workflow** をクリック。

確認：https://law.shioz.app
