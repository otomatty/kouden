import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs, registerKoden } from "./fixtures.ts";
import { USERS } from "./users.ts";

test.beforeEach(async ({ context }) => {
	await loginAs(context, USERS.returns);
});

test("カタログの登録・一括提案の確定（E6）と、印刷・Excel の出力（E7）", async ({ page }) => {
	const base = await createKouden(page, "返礼 確認");
	await page.goto(`${base}/reception`);
	await registerKoden(page, "小林 七郎", 10000);
	await registerKoden(page, "加藤 八郎", 5000);

	// カタログに品を登録する
	await page.goto(`${base}/returns/settings`);
	await expectAccessible(page);
	const addForm = page.locator("form", { has: page.getByRole("heading", { name: "品を追加" }) });
	await addForm.getByLabel("品名").fill("タオルセット");
	await addForm.getByLabel("価格（円）").fill("3000");
	await addForm.getByRole("button", { name: "追加する" }).click();
	await expect(page.getByText("保存しました。")).toBeVisible();

	// 一括提案を確定する
	await page.goto(`${base}/returns`);
	await expect(page.getByRole("heading", { name: "一括提案（2 人）" })).toBeVisible();
	await expectAccessible(page);
	await page.getByRole("button", { name: "選んだ方の香典返しを確定する" }).click();
	await expect(page.getByText("2 件の香典返しを作成しました。")).toBeVisible();
	await expectAccessible(page, "香典返し（確定後）");

	// 印刷用ページ
	await page.goto(`${base}/output`);
	await expectAccessible(page);
	for (const kind of ["gifts", "returns", "addresses"]) {
		await page.goto(`${base}/print/${kind}`);
		await expect(page.getByRole("button", { name: "印刷する" })).toBeVisible();
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expectAccessible(page);
	}

	// Excel のダウンロード（ファイル名は Content-Disposition の filename* で日本語を渡す）
	await page.goto(`${base}/output`);
	const download = page.waitForEvent("download");
	await page.getByRole("link", { name: "Excel をダウンロード" }).click();
	await download;
	const res = await page.request.get(`${base}/export.xlsx`);
	expect(res.headers()["content-type"]).toContain("spreadsheetml");
	expect(decodeURIComponent(res.headers()["content-disposition"] ?? "")).toMatch(
		/filename\*=UTF-8''故 返礼 確認 様_\d{8}\.xlsx/,
	);
});
