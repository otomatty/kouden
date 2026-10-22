import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs, registerKoden } from "./fixtures.ts";
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

	test("同じ差出人の行は、1 行で差出人を直すとほかの行にも入り、続けて直しても競合にしない", async ({
		page,
	}) => {
		const base = await createKouden(page, "表 同じ人");
		await page.goto(`${base}/gifts/new`);
		await registerKoden(page, "佐藤 一郎", 3000);
		// 2 件目は既存の差出人を選んで登録する（同じ人の香典が 2 件）
		await page.getByLabel("氏名").fill("佐藤 一郎");
		await page.getByRole("radio", { name: /佐藤 一郎/ }).check();
		await page.getByLabel("金額", { exact: true }).fill("5000");
		await page.getByRole("button", { name: "登録して次へ" }).click();
		await expect(page.locator("#created-gift")).toContainText("No.2、佐藤 一郎 様");

		await page.goto(`${base}/gifts/sheet`);
		const box = (name: string) => page.getByRole("textbox", { name, exact: true });
		await box("住所（番号 1）").fill("東京都千代田区千代田1-1");
		// 2 行目の住所の欄に移る（1 行目を保存する）。フォーカスがあるだけの欄も新しい住所にする
		await box("住所（番号 2）").click();
		await expect(page.locator("tbody tr").first()).toContainText("保存しました");
		await expect(box("住所（番号 2）")).toHaveValue("東京都千代田区千代田1-1");

		await box("金額（番号 2）").fill("6000");
		await page.keyboard.press("Enter");
		await expect(page.locator("tbody tr").nth(1)).toContainText("保存しました");
		await expect(page.locator("#entry-summary")).toContainText("2 件・香典 ¥9,000");
		// 2 行目の保存で、古い住所に戻していない
		await page.reload();
		await expect(box("住所（番号 1）")).toHaveValue("東京都千代田区千代田1-1");

		// 同じ人の 2 行に違う住所をまとめて貼り付けると、後の行は競合になる。その行の入力は消さない
		await box("住所（番号 1）").focus();
		await page.evaluate(() => {
			const data = new DataTransfer();
			data.setData("text/plain", "大阪府大阪市1-1\r\n京都府京都市2-2\r\n");
			document.activeElement?.dispatchEvent(
				new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
			);
		});
		await expect(page.locator("tbody tr").first()).toContainText("保存しました");
		await expect(page.locator("tbody tr").nth(1)).toContainText("他の人が更新しました");
		await expect(box("住所（番号 2）")).toHaveValue("京都府京都市2-2");
	});

	test("郵便番号から住所が入る前に行を離れても、入った住所を保存し、フォーカスを引き戻さない", async ({
		page,
	}) => {
		// 郵便番号のデータを遅れて返す（行を離れた後に住所が入る）
		await page.route("**/postal/100.json", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 800));
			await route.fulfill({ json: { "0001": ["東京都", "千代田区", "千代田"] } });
		});
		const base = await createKouden(page, "表 郵便番号");
		await page.goto(`${base}/gifts/sheet`);
		const box = (name: string) => page.getByRole("textbox", { name, exact: true });
		await box("氏名（1 行目）").fill("佐藤 一郎");
		await box("金額（1 行目）").fill("5000");
		await box("郵便番号（1 行目）").fill("1000001");
		await page.keyboard.press("Enter");
		await expect(box("氏名（2 行目）")).toBeFocused();
		await expect(box("住所（番号 1）")).toHaveValue("東京都千代田区千代田");
		await expect(box("氏名（2 行目）")).toBeFocused();
		await expect(page.locator("tbody tr").first()).toContainText("保存しました");

		await page.reload();
		await expect(box("住所（番号 1）")).toHaveValue("東京都千代田区千代田");
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
