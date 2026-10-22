import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs } from "./fixtures.ts";
import { USERS } from "./users.ts";

test.beforeEach(async ({ context }) => {
	await loginAs(context, USERS.ledger);
});

test.describe("表で入力（08 案 C、PC だけ）", () => {
	test("Tab・Enter で入力し、行を離れると保存する。↑ で前の行を直し、貼り付けた行はまとめて保存する", async ({
		page,
	}) => {
		const base = await createKouden(page, "表 確認");
		await page.goto(`${base}/gifts`);
		await page.getByRole("link", { name: "表で入力する" }).click();
		await expect(page).toHaveURL(`${base}/gifts/sheet`);
		await expectAccessible(page, "表で入力");
		const box = (name: string) => page.getByRole("textbox", { name, exact: true });
		const summary = page.locator("#entry-summary");

		// 氏名 → Tab → ふりがな → Tab → 金額 → Enter で、次の行の氏名へ移り、離れた行を保存する
		await box("氏名（1 行目）").click();
		await page.keyboard.type("佐藤 一郎");
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");
		await page.keyboard.type("1万");
		await page.keyboard.press("Enter");
		await expect(box("氏名（2 行目）")).toBeFocused();
		await expect(page.locator("tbody tr").first()).toContainText("保存しました");
		// 保存した形（金額の書き方）にそろい、番号が付く
		await expect(box("金額（番号 1）")).toHaveValue("10,000");
		await expect(summary).toContainText("1 件・香典 ¥10,000");

		// ↑ で上の行の同じ列へ移って直す。行を離れると保存する
		await page.keyboard.press("ArrowUp");
		await expect(box("氏名（番号 1）")).toBeFocused();
		await box("金額（番号 1）").fill("5000");
		await page.keyboard.press("Enter");
		await expect(summary).toContainText("1 件・香典 ¥5,000");

		// Excel からの貼り付け（3 行 × 氏名・ふりがな・金額）は、まとめて保存する
		await box("氏名（2 行目）").focus();
		await page.evaluate(() => {
			const data = new DataTransfer();
			data.setData(
				"text/plain",
				"鈴木 花子\tすずき はなこ\t5000\r\n高橋 次郎\t\t3,000\r\n伊藤 三郎\tいとう さぶろう\t1万\r\n",
			);
			document.activeElement?.dispatchEvent(
				new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
			);
		});
		await expect(summary).toContainText("4 件・香典 ¥23,000");
		await expect(box("氏名（番号 4）")).toHaveValue("伊藤 三郎");
		await expect(box("ふりがな（番号 2）")).toHaveValue("すずき はなこ");
		await expect(page.locator("#sr-status")).toHaveText("3 行を保存しました。");

		// 金額のない香典は、状態の欄にエラーを出す（ほかの行は保存したまま）
		await box("氏名（5 行目）").click();
		await page.keyboard.type("山本 九郎");
		await page.keyboard.press("Enter");
		await expect(box("金額（5 行目）")).toHaveAttribute("aria-invalid", "true");
		await expect(box("金額（5 行目）")).toHaveAccessibleDescription("香典の金額を入力してください");
		await expectAccessible(page, "表で入力（入力エラー）");

		// 一覧にも番号の順に並ぶ
		await box("金額（5 行目）").fill("2000");
		await page.keyboard.press("Enter");
		await expect(summary).toContainText("5 件・香典 ¥25,000");
		await page.goto(`${base}/gifts`);
		await expect(page.getByRole("status").filter({ hasText: "5 件・香典 ¥25,000" })).toBeVisible();
	});

	test("スマホの幅では表を出さず、1 件ずつの登録へ案内する", async ({ page }) => {
		const base = await createKouden(page, "表 スマホ");
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`${base}/gifts`);
		await expect(page.getByRole("link", { name: "表で入力する" })).toBeHidden();
		await page.goto(`${base}/gifts/sheet`);
		await expect(page.getByRole("table")).toBeHidden();
		await expect(page.getByText("表での入力はパソコン")).toBeVisible();
		await expectAccessible(page, "表で入力（スマホ）");
	});
});
