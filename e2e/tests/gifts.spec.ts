import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs, registerKoden } from "./fixtures.ts";
import { USERS } from "./users.ts";

test.beforeEach(async ({ context }) => {
	await loginAs(context, USERS.ledger);
});

test.describe("いただきものの登録（E4-1）をキーボードだけで操作する", () => {
	test("登録・入力エラー・既存の差出人の選択", async ({ page }) => {
		const base = await createKouden(page, "登録 確認");
		await page.goto(`${base}/gifts/new`);
		await expectAccessible(page);

		const name = page.getByLabel("氏名");
		const amount = page.getByLabel("金額", { exact: true });
		const created = page.locator("#created-gift");
		const status = page.locator("#sr-status");

		// 開くと氏名の欄にフォーカスがある。氏名 → Tab → 金額 → Enter で登録できる
		await expect(name).toBeFocused();
		await page.keyboard.type("佐藤 一郎");
		await page.keyboard.press("Tab");
		await expect(amount).toBeFocused();
		await page.keyboard.type("10000");
		await page.keyboard.press("Enter");

		// 画面を読み直さずに、登録した内容を上に出して読み上げる。次の入力のため氏名の欄に戻る
		await expect(created).toHaveText(/^登録しました。葬儀 No\.1、佐藤 一郎 様、香典 /);
		await expect(status).toHaveText(/^登録しました。葬儀 No\.1、佐藤 一郎 様/);
		await expect(name).toBeFocused();
		await expect(name).toHaveValue("");
		await expectAccessible(page, "いただきものの登録（登録後）");

		// 香典で金額がないとエラー。最初のエラーの欄（金額）にフォーカスが移る
		await page.keyboard.type("鈴木 花子");
		await page.keyboard.press("Enter");
		await expect(page.getByRole("alert")).toContainText("入力内容を確認してください");
		await expect(amount).toBeFocused();
		await expect(amount).toHaveAttribute("aria-invalid", "true");
		await expectAccessible(page, "いただきものの登録（入力エラー）");
		await page.keyboard.type("5000");
		await page.keyboard.press("Enter");
		await expect(created).toContainText("No.2、鈴木 花子 様");

		// 同じ名前を入れると候補が出て、件数が読み上げられる。矢印キーで既存の差出人を選べる
		await expect(name).toBeFocused();
		await page.keyboard.type("佐藤");
		await expect(page.getByRole("group", { name: "同じ人が登録されていませんか？" })).toBeVisible();
		await expect(status).toHaveText("同じ人の候補が 1 件あります。");
		await expectAccessible(page, "いただきものの登録（候補）");
		await page.keyboard.press("Tab");
		await expect(page.getByLabel("新しい差出人として登録する")).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("radio", { name: /佐藤 一郎/ })).toBeChecked();
		await page.keyboard.press("Tab");
		await expect(amount).toBeFocused();
		await page.keyboard.type("3000");
		await page.keyboard.press("Enter");
		await expect(created).toContainText("No.3、佐藤 一郎 様");

		// 差出人は 2 人のまま（佐藤 一郎 は 2 件）
		await page.goto(`${base}/persons`);
		await expect(page.getByRole("row")).toHaveCount(3);
		await expect(page.getByRole("row", { name: /佐藤 一郎/ })).toContainText("2");
	});
});

test.describe("かんたん登録（08 案 A）", () => {
	test("金額のボタンで登録し、種別で欄が変わり、その場で取り消せる", async ({ page }) => {
		const base = await createKouden(page, "かんたん 確認");
		await page.goto(`${base}/gifts/new`);
		const amount = page.getByLabel("金額", { exact: true });
		const summary = page.locator("#entry-summary");
		await expect(summary).toContainText("0 件・香典 ¥0");

		await page.getByLabel("氏名").fill("小川 一郎");
		const tenThousand = page.getByRole("button", { name: "¥10,000" });
		await tenThousand.click();
		await expect(amount).toHaveValue("10,000");
		await expect(tenThousand).toHaveAttribute("aria-pressed", "true");
		await page.getByRole("button", { name: "登録して次へ" }).click();
		await expect(page.locator("#created-gift")).toContainText("小川 一郎 様、香典 ¥10,000");
		await expect(summary).toContainText("1 件・香典 ¥10,000");

		// 種別に要る欄だけを出す。香典: 金額、供花: 金額・品名・数量、弔電: 文面
		const itemName = page.getByLabel("品名");
		const quantity = page.getByLabel("数量");
		const message = page.getByLabel("弔電の文面");
		await expect(itemName).toBeHidden();
		await expect(quantity).toBeHidden();
		await expect(message).toBeHidden();
		await page.locator('label:has(input[name="kind"][value="kyoka"])').click();
		await expect(amount).toBeVisible();
		await expect(itemName).toBeVisible();
		await expect(quantity).toBeVisible();
		await page.locator('label:has(input[name="kind"][value="choden"])').click();
		await expect(amount).toBeHidden();
		await expect(itemName).toBeHidden();
		await expect(message).toBeVisible();
		await page.locator('label:has(input[name="kind"][value="koden"])').click();
		await expect(amount).toBeVisible();
		await expect(itemName).toBeHidden();
		await expect(message).toBeHidden();

		// 自分が最近登録した分から、その場で取り消せる
		await page.getByRole("button", { name: "No.1 小川 一郎 の登録を取り消す" }).click();
		await expect(page.locator("#sr-status")).toHaveText(
			"No.1 小川 一郎 様の登録を取り消しました。",
		);
		await expect(summary).toContainText("0 件・香典 ¥0");
		await expectAccessible(page, "いただきものの登録（取り消し後）");
	});
});

test("郵便番号の 7 桁で住所に町域まで入り、住所の欄に移る（08 案 E）", async ({ page }) => {
	// 郵便番号のデータはデプロイ時に作るので、テストでは 1 件だけの見本を返す
	await page.route("**/postal/100.json", (route) =>
		route.fulfill({ json: { "0001": ["東京都", "千代田区", "千代田"] } }),
	);
	const base = await createKouden(page, "郵便番号 確認");
	await page.goto(`${base}/gifts/new`);
	const address = page.getByLabel("住所", { exact: true });
	await page.getByLabel("郵便番号").fill("１００－０００１");
	await expect(address).toHaveValue("東京都千代田区千代田");
	await expect(address).toBeFocused();
	await expect(page.locator("#sr-status")).toHaveText(
		"住所に「東京都千代田区千代田」を入れました。続けて番地を入力してください。",
	);
	// 番地を足した住所は、郵便番号を入れ直しても書き換えない
	await address.press("End");
	await page.keyboard.type("1-1");
	await page.getByLabel("郵便番号").fill("1000001");
	await expect(address).toHaveValue("東京都千代田区千代田1-1");
});

test.describe("いただきもの・差出人", () => {
	test("スマホでは一覧をカードで出し、香典袋の番号で探せる", async ({ page }) => {
		const base = await createKouden(page, "カード 確認");
		await page.goto(`${base}/gifts/new`);
		await registerKoden(page, "松本 一郎", 10000);
		// 登録後は番号を大きく出す（香典袋に書き写すため）
		await expect(
			page.getByText("香典袋にこの番号を書いておくと、あとで照合できます。"),
		).toBeVisible();
		await registerKoden(page, "井上 二郎", 5000);

		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`${base}/gifts`);
		await expect(page.getByRole("table")).toBeHidden();
		const card = page.getByRole("link", { name: /No\.2.*井上 二郎/ });
		await expect(card).toBeVisible();
		await expect(card).toContainText("¥5,000");
		await expectAccessible(page, "いただきもの（スマホ）");

		await page.getByRole("searchbox").fill("No.1");
		await page.getByRole("searchbox").press("Enter");
		await expect(page.getByRole("status").filter({ hasText: "1 件" })).toBeVisible();
		await expect(page.getByRole("link", { name: /松本 一郎/ })).toBeVisible();
		await expect(page.getByRole("link", { name: /井上 二郎/ })).toHaveCount(0);

		await page.getByRole("link", { name: /松本 一郎/ }).click();
		await expect(page).toHaveURL(new RegExp(`${base}/gifts/[0-9a-f-]+$`));
	});

	test("一覧の検索と、差出人の行の中での編集（フォーカスを失わない）", async ({ page }) => {
		const base = await createKouden(page, "一覧 確認");
		await page.goto(`${base}/gifts/new`);
		await registerKoden(page, "高橋 次郎", 30000);
		await registerKoden(page, "伊藤 三郎", 5000);

		await page.goto(`${base}/gifts`);
		await expect(page.getByRole("status").filter({ hasText: "2 件" })).toBeVisible();
		await page.getByRole("searchbox").fill("高橋");
		await page.getByRole("searchbox").press("Enter");
		await expect(page.getByRole("status").filter({ hasText: "1 件" })).toBeVisible();
		await expect(page.getByRole("cell", { name: /高橋 次郎/ })).toBeVisible();
		await expectAccessible(page, "いただきもの（検索）");

		await page.goto(`${base}/persons`);
		await expectAccessible(page);
		const edit = page.getByRole("link", { name: "伊藤 三郎 を編集" });
		await edit.focus();
		await page.keyboard.press("Enter");
		// 行が編集欄になり、氏名の欄にフォーカスが移る
		await expect(page.getByRole("textbox", { name: "氏名", exact: true })).toBeFocused();
		await expectAccessible(page, "差出人（行の編集）");
		await page.keyboard.press("Tab");
		await page.keyboard.type("いとう さぶろう");
		await page.getByRole("button", { name: "保存", exact: true }).press("Enter");
		// 表示に戻った行の「編集」にフォーカスが戻り、保存したことが読み上げられる
		await expect(page.locator("#sr-status")).toHaveText("伊藤 三郎 を保存しました。");
		await expect(page.getByRole("link", { name: "伊藤 三郎 を編集" })).toBeFocused();
		await expect(page.getByRole("row", { name: /伊藤 三郎/ })).toContainText("いとう さぶろう");

		// 取り消しても「編集」に戻る
		await page.keyboard.press("Enter");
		await expect(page.getByRole("textbox", { name: "氏名", exact: true })).toBeFocused();
		await page.getByRole("button", { name: "取り消す" }).press("Enter");
		await expect(page.getByRole("link", { name: "伊藤 三郎 を編集" })).toBeFocused();
	});
});

test.describe("通信が遅いとき", () => {
	test("差出人の候補は最新の入力で出し、登録と重なった候補の検索の結果は出さない", async ({
		page,
	}) => {
		const base = await createKouden(page, "遅延 確認");
		await page.goto(`${base}/gifts/new`);
		await registerKoden(page, "佐藤 一郎", 10000);
		await registerKoden(page, "鈴木 花子", 5000);

		// 候補の応答を遅らせる（取り消された要求は続けられないので無視する）
		await page.route("**/persons/candidates*", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1500));
			await route.continue().catch(() => undefined);
		});
		const candidatesRequest = (text: string) =>
			page.waitForRequest(
				(r) =>
					r.url().includes("/persons/candidates") && decodeURIComponent(r.url()).includes(text),
			);
		const name = page.getByRole("textbox", { name: "氏名", exact: true });
		const status = page.locator("#sr-status");
		const candidates = page.getByRole("group", { name: "同じ人が登録されていませんか？" });

		// 「佐藤」の検索の応答を待つ間に「鈴木」に変えると、「鈴木」の候補が出る
		const first = candidatesRequest("佐藤");
		await name.fill("佐藤");
		await first;
		await name.fill("鈴木");
		await expect(candidates.getByRole("radio", { name: /鈴木 花子/ })).toBeVisible();
		await expect(candidates.getByRole("radio", { name: /佐藤 一郎/ })).toHaveCount(0);
		await expect(status).toHaveText("同じ人の候補が 1 件あります。");

		// 候補の検索の応答を待つ間に登録しても、登録後の入力欄に古い候補は出ない
		const pending = candidatesRequest("一郎");
		await name.fill("佐藤 一郎");
		await pending;
		await page.getByLabel("金額", { exact: true }).fill("1000");
		await page.getByRole("button", { name: "登録して次へ" }).click();
		const created = page.locator("#created-gift");
		await expect(created).toContainText("No.3、佐藤 一郎 様");
		await page.waitForTimeout(2000);
		await expect(candidates).toHaveCount(0);
		await expect(created).toContainText("No.3、佐藤 一郎 様");
	});
});

test("複数の行を編集中でも、エラーのフォーカスは保存した行の欄に移る", async ({ page }) => {
	const base = await createKouden(page, "複数行 確認");
	await page.goto(`${base}/gifts/new`);
	await registerKoden(page, "山本 九郎", 3000);
	await registerKoden(page, "中村 十郎", 3000);
	await page.goto(`${base}/persons`);

	// 一覧の上から 1 行目・2 行目の順に編集する（上の行のエラーが文書の中で先に見つかる配置にする）
	const editLinks = page.getByRole("link", { name: / を編集$/ });
	await expect(editLinks).toHaveCount(2);
	const hrefs = await editLinks.evaluateAll((links) => links.map((a) => a.getAttribute("href")));
	const editRow = async (index: number) => {
		const id = hrefs[index]?.split("/").pop() ?? "";
		await page
			.locator(`#person-${id}`)
			.getByRole("link", { name: / を編集$/ })
			.click();
		const field = page.locator(`#p-${id}-name`);
		await expect(field).toBeFocused();
		return field;
	};

	// 上の行を空の氏名で保存してエラーを残す
	const first = await editRow(0);
	await first.fill("");
	await first.press("Enter");
	await expect(first).toHaveAttribute("aria-invalid", "true");
	await expect(first).toBeFocused();

	// 下の行も同じようにすると、フォーカスは上の行ではなく、保存した行の欄に移る
	const second = await editRow(1);
	await second.fill("");
	await second.press("Enter");
	await expect(second).toHaveAttribute("aria-invalid", "true");
	// フォーカスの移動は htmx の差し替えの後（settle）に行われるので、それを待ってから確かめる
	await page.waitForTimeout(500);
	await expect(second).toBeFocused();
});
