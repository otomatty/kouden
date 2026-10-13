import { expect, test } from "@playwright/test";
import { expectAccessible, expectSkipLink } from "./fixtures.ts";

const PAGES = [
	{ path: "/", heading: /香典帳/ },
	{ path: "/pricing", heading: "料金" },
	{ path: "/faq", heading: "よくある質問" },
	{ path: "/terms", heading: "利用規約" },
	{ path: "/privacy", heading: "プライバシーポリシー" },
	{ path: "/legal/tokushoho", heading: "特定商取引法に基づく表記" },
	{ path: "/login", heading: /ログイン/ },
];

test.describe("公開ページ（E11）", () => {
	for (const p of PAGES) {
		test(`${p.path} はログインなしで見られ、アクセシビリティの違反がない`, async ({ page }) => {
			const res = await page.goto(p.path);
			expect(res?.status()).toBe(200);
			await expect(page.getByRole("heading", { level: 1, name: p.heading })).toBeVisible();
			await expectAccessible(page);
		});
	}

	test("ログインが必要なページは、戻り先を付けてログイン画面へ送る", async ({ page }) => {
		await page.goto("/k/new");
		await expect(page).toHaveURL("/login?return_to=%2Fk%2Fnew");
	});

	test("存在しないページは 404 を返す", async ({ page }) => {
		const res = await page.goto("/no-such-page");
		expect(res?.status()).toBe(404);
		await expectAccessible(page);
	});
});

test("キーボードで最初に「本文へ移動」が現れ、本文へ移動できる", async ({ page }) => {
	await page.goto("/pricing");
	await expectSkipLink(page);
});
