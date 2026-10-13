import { expect, test } from "@playwright/test";
import { expectAccessible } from "./fixtures.ts";
import { USERS } from "./users.ts";

// 運営者画面（apps/admin）。ローカルでは Access を通らず、devEmail を運営者として扱う
const ADMIN = "http://localhost:5174";

test("運営者画面: ダッシュボード・検索・ユーザーの詳細・監査ログ（E10）", async ({ page }) => {
	await page.goto(`${ADMIN}/`);
	await expect(page.getByRole("heading", { level: 1, name: "ダッシュボード" })).toBeVisible();
	await expectAccessible(page);

	await page.getByRole("link", { name: "検索" }).click();
	await page.getByLabel("メールアドレス・表示名・香典帳の名前・ID").fill("returns@e2e.test");
	await page.getByRole("button", { name: "検索" }).click();
	await expect(page.getByRole("heading", { name: "ユーザー（1）" })).toBeVisible();
	await expectAccessible(page);

	await page.getByRole("link", { name: USERS.returns.name }).click();
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expectAccessible(page);

	for (const path of ["/legacy", "/audit"]) {
		await page.goto(`${ADMIN}${path}`);
		await expectAccessible(page);
	}

	// 本文へ移動
	await page.keyboard.press("Tab");
	await expect(page.getByRole("link", { name: "本文へ移動" })).toBeFocused();
});
