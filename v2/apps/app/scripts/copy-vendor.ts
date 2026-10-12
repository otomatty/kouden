/**
 * 外部ライブラリのブラウザ用ファイルを Static Assets にコピーする（CDN は使わない。CSP は 'self' のみ）。
 * バージョンは package.json で固定している。
 */
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const outDir = path.join(root, "public/assets");
mkdirSync(outDir, { recursive: true });

const files = [["node_modules/htmx.org/dist/htmx.min.js", "htmx.min.js"]] as const;
for (const [from, to] of files) {
	copyFileSync(path.join(root, from), path.join(outDir, to));
	console.log(`copied ${from} → public/assets/${to}`);
}
