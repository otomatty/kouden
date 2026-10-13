import { expect, test } from "@playwright/test";
import { expectAccessible, loginAs } from "./fixtures.ts";
import { MIGRATED_KOUDENS, USERS } from "./users.ts";

test("移行した故人名を確認し、再訪しても案内が出ない", async ({ page, context }, testInfo) => {
	await loginAs(context, USERS.migration);
	const base = `/k/${MIGRATED_KOUDENS[testInfo.retry]}`;
	await page.goto(`${base}/gifts`);
	const notice = page.getByRole("complementary", { name: "故人のお名前の確認" });
	await expect(notice).toBeVisible();
	await expectAccessible(page, "移行した香典帳の確認案内");
	await page.getByRole("link", { name: "故人のお名前を確認する", exact: true }).click();
	const name = page.getByRole("textbox", { name: "故人のお名前" });
	await expect(name).toHaveValue("");
	await page.getByRole("button", { name: "確認して保存する" }).click();
	await expect(name).toHaveAttribute("aria-invalid", "true");
	await expect(name).toBeFocused();
	await expectAccessible(page, "故人名確認の入力エラー");

	await name.fill("山田 一郎");
	await page.locator('input[name="title"]').fill("一郎の香典帳");
	await page.getByRole("button", { name: "確認して保存する" }).click();
	await expect(
		page.getByRole("status").filter({ hasText: "故人のお名前を確認しました。" }),
	).toBeVisible();
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("一郎の香典帳");
	await expect(notice).toHaveCount(0);
	await expectAccessible(page, "故人名確認後の設定");

	await page.reload();
	await expect(name).toHaveValue("山田 一郎");
	await expect(notice).toHaveCount(0);
	await page.goto(base);
	await expect(notice).toHaveCount(0);
	await expect(page.getByText("故 山田 一郎 様", { exact: true })).toBeVisible();
});
