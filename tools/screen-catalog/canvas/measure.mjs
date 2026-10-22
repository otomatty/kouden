// 画面カタログの各画面の高さを PC（1280px）とスマホ（390px）の幅で測る（アートボードの高さに使う）。
// 使い方（tools/screen-catalog で）: node canvas/measure.mjs dist canvas/.work/heights.json
// e2e/ の Playwright を使う。手元の Chromium を使う場合は PLAYWRIGHT_CHROMIUM_PATH を設定する
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(here, "../../../e2e/package.json"));
const { chromium } = require("@playwright/test");

const [dist, out] = process.argv.slice(2).map((p) => resolve(p));
if (!dist || !out) throw new Error("usage: node canvas/measure.mjs <dist> <out.json>");

const browser = await chromium.launch(
	process.env.PLAYWRIGHT_CHROMIUM_PATH
		? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
		: {},
);
const heights = {};
for (const [device, width, height] of [
	["pc", 1280, 800],
	["sp", 390, 844],
]) {
	const page = await browser.newPage({ viewport: { width, height } });
	for (const file of readdirSync(`${dist}/screens`)) {
		await page.goto(pathToFileURL(`${dist}/screens/${file}`).href);
		await page.waitForLoadState("load");
		(heights[file] ??= {})[device] = await page.evaluate(
			() => document.documentElement.scrollHeight,
		);
	}
	await page.close();
}
await browser.close();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(heights));
console.warn(`${Object.keys(heights).length} screens -> ${out}`);
