import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs, registerKoden } from "./fixtures.ts";
import { USERS } from "./users.ts";

test.beforeEach(async ({ context }) => {
	await loginAs(context, USERS.ledger);
});

test("差出人の統合（E5-2）: 候補の一覧から選び、確かめてから 1 人にまとめる", async ({ page }) => {
	const base = await createKouden(page, "統合 確認");
	await page.goto(`${base}/gifts/new`);
	await registerKoden(page, "佐藤 一郎", 10000);
	await registerKoden(page, "佐藤一郎", 5000);

	// 一覧に候補の組の数が出る。「確かめる」で候補だけを並べる
	await page.goto(`${base}/persons`);
	await expect(page.getByText("名前・ふりがなが同じ差出人が 1 組あります")).toBeVisible();
	await page.getByRole("link", { name: "確かめる" }).click();
	await expect(page).toHaveURL(`${base}/persons?duplicates=1`);
	await expectAccessible(page, "差出人（同じ人かもしれない差出人）");
	await page.getByRole("link", { name: "佐藤 一郎 を残してまとめる" }).click();

	// まとめる相手を選ぶ
	await expect(
		page.getByRole("heading", { name: "佐藤 一郎 とまとめる差出人を選ぶ" }),
	).toBeVisible();
	await expectAccessible(page, "まとめる差出人を選ぶ");
	await page.getByRole("link", { name: "佐藤一郎 を選ぶ" }).click();

	// 2 人と、まとめた後を並べて確かめる
	await expect(page.getByRole("heading", { name: "差出人をまとめる" })).toBeVisible();
	await expect(page.getByRole("row", { name: /いただきもの/ })).toContainText("2 件");
	await expectAccessible(page, "差出人をまとめる（確認）");
	await page.getByRole("button", { name: "佐藤一郎 を 佐藤 一郎 にまとめる" }).click();

	await expect(
		page.getByRole("status").filter({ hasText: "差出人をまとめました。" }),
	).toBeVisible();
	await expect(page.getByRole("heading", { name: /香典の合計 ¥15,000/ })).toBeVisible();
	await expectAccessible(page, "差出人（まとめた後）");

	await page.goto(`${base}/persons`);
	await expect(page.getByRole("row")).toHaveCount(2);
	await expect(page.getByText("名前・ふりがなが同じ差出人が")).toHaveCount(0);
});
