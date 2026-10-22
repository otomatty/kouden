import { expect, type Locator, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs } from "./fixtures.ts";
import { USERS } from "./users.ts";

// Chromium の仮のカメラ（動く模様の映像）を使う。読み取りは development の仮の実装（写真ごとに見本を返す）
test.use({
	launchOptions: {
		...(process.env.PLAYWRIGHT_CHROMIUM_PATH
			? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
			: {}),
		args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
	},
	permissions: ["camera"],
});

test.beforeEach(async ({ context }) => {
	await loginAs(context, USERS.ledger);
});

/** 1×1 の PNG（「写真を選ぶ」用） */
const PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

/** 見本によっては金額が読めない（空になる）ので、そのときは入れる */
async function fillAmountIfEmpty(card: Locator) {
	const amount = card.getByLabel("金額");
	if ((await amount.inputValue()) === "") await amount.fill("5000");
}

test("写真で登録（08 案 D）: 撮った写真を裏で読み取り、下書きを確かめてまとめて登録する", async ({
	page,
}) => {
	const base = await createKouden(page, "写真 確認");
	await page.goto(`${base}/gifts/new`);
	await page.getByRole("link", { name: "写真で登録する" }).click();
	await expect(page).toHaveURL(/\/gifts\/scan\?event=/);
	await expectAccessible(page, "写真で登録");

	await page.getByRole("button", { name: "カメラを始める" }).click();
	const shoot = page.getByRole("button", { name: "撮る", exact: true });
	await expect(shoot).toBeFocused();
	await expect(page.getByLabel("自動で撮る")).toBeChecked();

	// 読み取りを待たずに続けて撮れる
	await shoot.click();
	await shoot.click();
	const cards = page.locator("[data-draft]");
	await expect(cards).toHaveCount(2);
	for (const card of await cards.all()) {
		await expect(card).toContainText("読み取りました");
		await expect(card.getByRole("img", { name: /撮った写真/ })).toBeVisible();
		await fillAmountIfEmpty(card);
	}
	await expect(page.getByRole("heading", { name: /下書き 2 件/ })).toBeVisible();
	await expectAccessible(page, "写真で登録（下書き）");

	// 「写真を選ぶ」からも足せる。要らない下書きは捨てる
	await page.locator("[data-scan-files]").setInputFiles({
		name: "envelope.png",
		mimeType: "image/png",
		buffer: PNG,
	});
	await expect(cards).toHaveCount(3);
	await expect(cards.nth(2)).toContainText("読み取りました");
	await cards.nth(2).getByRole("button", { name: "捨てる" }).click();
	await expect(cards).toHaveCount(2);

	// まとめて登録すると、写真を消して番号を大きく出す（香典袋に書き写す）。
	// 登録の応答を待つ間は、下書きを直したり捨てたりできない
	const { promise: held, resolve: release } = Promise.withResolvers<void>();
	await page.route("**/gifts/sheet", async (route) => {
		await held;
		await route.continue();
	});
	await page.getByRole("button", { name: "まとめて登録する" }).click();
	await expect(cards.nth(0).getByRole("button", { name: "捨てる" })).toBeDisabled();
	await expect(cards.nth(0).getByLabel("氏名")).toHaveAttribute("readonly", "");
	release();
	await expect(cards.nth(0)).toContainText("No.1");
	await expect(cards.nth(1)).toContainText("No.2");
	await expect(page.getByRole("img", { name: /撮った写真/ })).toHaveCount(0);
	await expect(page.locator("#sr-status")).toHaveText(
		"2 件を登録しました。香典袋に番号を書いてください。",
	);
	await expect(page.locator("#entry-summary")).toContainText("2 件");
	await expectAccessible(page, "写真で登録（登録後）");

	await page.getByRole("button", { name: "カメラを止める" }).click();
	await expect(page.getByRole("button", { name: "カメラを始める" })).toBeFocused();
});
