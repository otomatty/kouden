import { expect, test } from "@playwright/test";
import { expectAccessible, loginAs } from "./fixtures.ts";
import { LEAVING_USERS, USERS } from "./users.ts";

test("表示名を変えると、ヘッダーに反映される。空欄はエラーの欄にフォーカスが移る（E1-5）", async ({
	page,
	context,
}) => {
	await loginAs(context, USERS.account);
	await page.goto("/account");
	await expectAccessible(page);

	const field = page.getByRole("textbox", { name: /^表示名/ });
	await field.fill("");
	await page.getByRole("button", { name: "保存する" }).click();
	await expect(field).toHaveAttribute("aria-invalid", "true");
	await expect(field).toBeFocused();
	await expectAccessible(page, "アカウント（入力エラー）");

	await field.fill("田中 四郎（長男）");
	await page.getByRole("button", { name: "保存する" }).click();
	await expect(page.getByText("表示名を保存しました。")).toBeVisible();
	await expect(page.getByRole("link", { name: "田中 四郎（長男） さん" })).toBeVisible();
});

test("アカウントを削除すると、ログアウトした状態になる（E1-4）", async ({ page, context }) => {
	// 削除は元に戻せないので、再試行のたびに別の利用者を使う
	const leaving = LEAVING_USERS[test.info().retry];
	if (!leaving) throw new Error("再試行の回数に対して LEAVING_USERS が足りません");
	await loginAs(context, leaving);
	await page.goto("/account");
	await page.getByLabel("上記を確認しました").check();
	await page.getByRole("button", { name: "アカウントを削除する" }).click();
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("アカウントを削除しました");
	await expectAccessible(page);

	await page.goto("/k/new");
	await expect(page).toHaveURL(/\/login\?/);
});
