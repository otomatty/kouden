# 画面カタログ

利用者向けアプリ（`apps/app`）と運営者画面（`apps/admin`）のすべての画面を、状態ごとに一覧できる静的なページを作ります。デザインの見直しや、画面の変更の確認に使います。

- 画面は実際のビュー（Hono JSX）をサンプルデータ（`src/fixtures.ts`・`src/admin-fixtures.ts`）で描画します。D1・DO・サーバーは使いません
- 1 つの画面に、ロール（オーナー・編集者・閲覧者）・空・入力エラー・保存時の競合・アーカイブ中などの状態を並べ、PC（1280px）とスマホ（390px）の幅で表示します
- プレビューの中のリンクを押すと、その先の画面に移ります。画面の行き来（どの画面からどの画面へ移れるか）はリンクから求めます

## 使い方

リポジトリの直下で実行します。

```sh
bun run catalog          # dist/ に書き出して http://localhost:5180 で配る
```

`tools/screen-catalog` の中では `bun run catalog`（書き出すだけ。`dist/index.html` をブラウザで開く）・`bun run catalog:serve`（書き出して配る）を使えます。

## 画面・状態を追加する

`src/catalog.tsx` の `catalog` に追加します。

- 画面: `path`（URL のパターン。`:id` は任意の 1 区間）・`access`（見られる人）・`description`・`source`（ビューのファイル）
- 状態: `render` で画面を返す。ルートと同じ組み立て（`Layout`・`KoudenShell`）にするため、香典帳の中の画面は `inKouden()` で包む
- 状態の `query` を書くと、`?tab=archived` のようなリンクがその状態を指します（`event=` のように値を省くと項目があれば一致）

ビューの props を変えたときは、ここも合わせて直します。`bun run test`（`test/catalog.test.ts`）がすべての状態を描画するので、描画できない状態があれば CI で分かります。

## 仕組み

`scripts/build.ts` が次を行います。

1. `apps/app`・`apps/admin` の CSS（Tailwind）を作る
2. 各状態を描画して `dist/screens/<画面>--<状態>.html` に書く（`src/render.ts`）。CSS は相対パスにし、htmx などのスクリプトを外して `src/client/bridge.js` に替える。アプリの中へのリンクは対応する状態のファイルに張り替える
3. `src/client/index.html` に画面の一覧を埋め込んで `dist/index.html` に書く

htmx・WebSocket は動かないので、入力欄の候補や受付の登録結果などは、その状態を別に描画して見せます。

## デザインキャンバスを更新する

画面カタログは、Claude 上のデザインキャンバス「香典帳 画面一覧」（https://claude.ai/artifact/Vg2toBoe9sBNNPZaQQiY9h）の元にもなっています。このブランチ（`claude/design-canvas-tools`）は `main` にマージしない保存用です。使うときは最新の `main` を取り込んでから作業します。

`canvas/` の中身:

| ファイル                          | 内容                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `measure.mjs`                     | 各画面の高さを PC（1280px）・スマホ（390px）で測る（e2e/ の Playwright を使う）         |
| `convert.py`                      | 画面カタログを、キャンバスのアートボード（`.dc.html`）と索引（`canvas.json`）に変換する |
| `Main.dc.html`                    | キャンバスの最初のページ「画面構成」。画面と状態の数は手で直す                          |
| `assets.json`                     | キャンバスにアップロード済みの CSS・画像の URL（`/_blob/…`）                            |
| `photo-placeholder.svg`・`qr.svg` | 画像の代わり（アップロード済み。消えたときのため）                                      |

手順（`tools/screen-catalog` で。Claude に頼む場合は、この節を読んでもらう）:

1. `git merge origin/main`（画面の最新を取り込む）、`bun install`
2. `bun run catalog`（`dist/` に全画面を書き出す）
3. `node canvas/measure.mjs dist canvas/.work/heights.json`
4. CSS が変わったとき（`dist/assets/app.css`・`admin.css`）は、キャンバスにアセットとしてアップロードし、返ってきた URL で `canvas/assets.json` を書き換える。古い CSS のままだと、新しいクラス（アイコンの大きさなど）が効かない
5. キャンバスから今の `project/canvas.json` を読み、`python3 -I canvas/convert.py --dist dist --heights canvas/.work/heights.json --assets canvas/assets.json --out canvas/.work/project --canvas <読んだ canvas.json>`（beautifulsoup4 が必要）
6. `canvas/Main.dc.html` を `canvas/.work/project/` に写し、状態の数（「39 画面・140 状態」と各画面の数）を直す
7. `canvas/.work/project/` の中身をキャンバスの `project/` に公開する（1 回 255 ファイルまでなので、`canvas.json`・`Main.dc.html`・PC の画面、スマホの画面の 2 回に分ける）。なくなった状態のファイルは `null` で消す

画面・状態を足すときは `src/catalog.tsx` に書く（上の「画面・状態を追加する」）。キャンバスにもそのまま反映される。
