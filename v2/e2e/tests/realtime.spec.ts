import { expect, test } from "@playwright/test";
import { createKouden, expectAccessible, loginAs, registerKoden } from "./fixtures.ts";
import { USERS } from "./users.ts";

test("招待で参加したメンバーの画面に、他の人の登録が読み込み直さずに反映される（E3-2・E4-6）", async ({
	browser,
}) => {
	const ownerContext = await browser.newContext();
	const editorContext = await browser.newContext();
	await loginAs(ownerContext, USERS.liveOwner);
	await loginAs(editorContext, USERS.liveEditor);
	const owner = await ownerContext.newPage();
	const editor = await editorContext.newPage();

	// オーナーが編集者の招待リンクを作る
	const base = await createKouden(owner, "共有 確認");
	await owner.goto(`${base}/members`);
	await owner.getByRole("button", { name: "招待リンクを作成" }).click();
	await expectAccessible(owner, "メンバー（招待リンクの作成後）");
	const inviteUrl = await owner.getByRole("textbox", { name: "招待リンク" }).inputValue();
	expect(inviteUrl).toMatch(/\/invite\//);

	// 招待された人が参加する（編集者は受付画面へ進む）
	await editor.goto(new URL(inviteUrl).pathname);
	await expectAccessible(editor, "招待");
	await editor.getByRole("button", { name: "参加する" }).click();
	await editor.waitForURL((url) => url.pathname === `${base}/reception`);
	await editor.goto(`${base}/gifts`);
	await expect(editor.getByText("まだ登録がありません。")).toBeVisible();

	// オーナーが受付で登録すると、編集者の一覧に現れる。閲覧中のメンバーも互いに見える
	await owner.goto(`${base}/reception`);
	await expect(owner.getByText(`閲覧中: ${USERS.liveEditor.name}`)).toBeVisible();
	await expect(editor.getByText(`閲覧中: ${USERS.liveOwner.name}`)).toBeVisible();
	await registerKoden(owner, "中村 六郎", 10000);
	await expect(editor.getByRole("cell", { name: /中村 六郎/ })).toBeVisible();
	await expect(editor.getByRole("status").filter({ hasText: "1 件" })).toBeVisible();

	await ownerContext.close();
	await editorContext.close();
});
