import { describe, expect, it } from "vitest";
import { catalog } from "../src/catalog.tsx";
import { renderCatalog, resolveLink } from "../src/render.ts";

const screens = catalog.flatMap((g) => g.screens);
const resolve = (href: string, audience: "guest" | "member" = "member") =>
	resolveLink(href, "app", audience, screens);

describe("画面カタログ", () => {
	it("画面と状態の ID が重ならない", () => {
		const ids = screens.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const s of screens) {
			const states = s.states.map((st) => st.id);
			expect(new Set(states).size, s.id).toBe(states.length);
		}
	});

	it("すべての状態を描画でき、リンクはカタログの画面を指す", async () => {
		const pages = await renderCatalog(catalog);
		expect(pages).toHaveLength(screens.reduce((n, s) => n + s.states.length, 0));
		const files = new Set(pages.map((p) => p.file));
		for (const page of pages) {
			expect(page.html, page.file).toMatch(/^<!DOCTYPE html>/);
			expect(page.html, page.file).toContain("../assets/bridge.js");
			expect(page.html, page.file).not.toContain('src="/assets/');
			for (const [, file] of page.html.matchAll(/ href="([^"]+\.html)" data-kc-screen/g)) {
				expect(files, `${page.file} → ${file}`).toContain(file);
			}
		}
	});

	it("URL から画面と状態を選ぶ", () => {
		expect(resolve("/", "guest")).toEqual({ screenId: "home", stateId: "default" });
		expect(resolve("/?tab=archived")).toEqual({ screenId: "dashboard", stateId: "archived" });
		expect(resolve("/k/new")).toEqual({ screenId: "new-kouden", stateId: "default" });
		expect(resolve("/k/abc/returns/settings")).toEqual({
			screenId: "return-settings",
			stateId: "default",
		});
		expect(resolve("/k/abc/gifts?event=ev-1")).toEqual({ screenId: "gifts", stateId: "filtered" });
		expect(resolve("/k/abc/export.xlsx")).toBeNull();
	});
});
