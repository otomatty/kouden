import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { catalog } from "../src/catalog.tsx";
import { type PageLink, renderCatalog, type RenderedPage } from "../src/render.ts";

/**
 * 画面カタログを dist/ に書き出す（bun run catalog）。
 * 1. 利用者向けアプリと運営者画面の CSS を作る（Tailwind）
 * 2. 各画面の状態をサンプルデータで描画し、dist/screens/ に 1 状態 1 ファイルで書く
 * 3. 一覧と画面ごとの状態を並べる dist/index.html を書く
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "../..");
const dist = join(root, "dist");

for (const app of ["app", "admin"]) {
	execFileSync("bun", ["run", "css"], { cwd: join(repo, "apps", app), stdio: "inherit" });
}

const pages = await renderCatalog(catalog);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "screens"), { recursive: true });
mkdirSync(join(dist, "assets"), { recursive: true });
copyFileSync(join(repo, "apps/app/public/assets/app.css"), join(dist, "assets/app.css"));
copyFileSync(join(repo, "apps/admin/public/assets/admin.css"), join(dist, "assets/admin.css"));
copyFileSync(join(root, "src/client/bridge.js"), join(dist, "assets/bridge.js"));

for (const page of pages) writeFileSync(join(dist, "screens", page.file), page.html);

writeFileSync(join(dist, "index.html"), indexHtml(pages));
console.log(
	`画面カタログ: ${dist}/index.html（${catalog.flatMap((g) => g.screens).length} 画面・${pages.length} 状態）`,
);

function indexHtml(rendered: RenderedPage[]): string {
	const links = new Map<string, PageLink[]>();
	for (const p of rendered) links.set(p.screenId, [...(links.get(p.screenId) ?? []), ...p.links]);
	const data = {
		builtAt: new Date().toISOString(),
		commit: gitCommit(),
		groups: catalog.map((g) => ({
			id: g.id,
			title: g.title,
			description: g.description,
			screens: g.screens.map((s) => ({
				id: s.id,
				title: s.title,
				app: s.app,
				path: s.path,
				audience: s.audience ?? null,
				access: s.access,
				description: s.description,
				source: s.source,
				states: s.states.map((st) => ({
					id: st.id,
					label: st.label,
					note: st.note ?? null,
					file: `screens/${rendered.find((p) => p.screenId === s.id && p.stateId === st.id)?.file}`,
				})),
				// 遷移先（この画面の本文にあるリンクの行き先。自分自身は除く）
				to: [...new Set((links.get(s.id) ?? []).map((l) => l.screenId))].filter(
					(id) => id !== s.id,
				),
			})),
		})),
	};
	const template = readFileSync(join(root, "src/client/index.html"), "utf8");
	return template.replace(
		// oxfmt が `/*CATALOG_DATA*/ null` と空白を入れるので、空白の有無によらず置き換える
		/\/\*CATALOG_DATA\*\/\s*null/,
		// </script> で閉じないよう < をエスケープする
		JSON.stringify(data).replaceAll("<", "\\u003c"),
	);
}

function gitCommit(): string | null {
	try {
		return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repo }).toString().trim();
	} catch {
		return null;
	}
}
