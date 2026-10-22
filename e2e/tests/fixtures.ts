import { AxeBuilder } from "@axe-core/playwright";
import { type BrowserContext, expect, type Page } from "@playwright/test";
import type { E2EUser } from "./users.ts";

/** セッションの Cookie を付けて、その利用者としてログインした状態にする */
export async function loginAs(context: BrowserContext, user: E2EUser) {
	await context.addCookies([
		{
			name: "__Host-kouden_session",
			value: user.token,
			// 先頭に「.」のない domain は host-only の Cookie になる（__Host- の条件）。
			// url で指定すると http の URL に Secure の Cookie を付けることになり、Chromium が受け付けない
			domain: "localhost",
			path: "/",
			secure: true,
			httpOnly: true,
			sameSite: "Lax",
		},
	]);
}

/**
 * WCAG 2.1 A/AA の自動検査（02 非機能要件: フォーム要素のラベル・コントラスト比 4.5:1 以上）。
 * 違反があれば、規則と該当箇所が分かる形で失敗させる。
 */
export async function expectAccessible(page: Page, label = new URL(page.url()).pathname) {
	const { violations } = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	const summary = violations.map((v) => ({
		rule: v.id,
		impact: v.impact,
		help: v.help,
		targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
	}));
	expect(summary, `アクセシビリティの違反（${label}）`).toEqual([]);
}

/** 新しい香典帳を作り、そのパス（/k/:id）を返す */
export async function createKouden(page: Page, deceasedName: string): Promise<string> {
	await page.goto("/k/new");
	await page.getByLabel("故人のお名前").fill(deceasedName);
	await page.getByRole("button", { name: "作成する" }).click();
	await page.waitForURL(/\/k\/[0-9a-f-]+$/);
	return new URL(page.url()).pathname;
}

/** いただきものの登録画面で香典を 1 件登録する（登録画面を開いた状態で呼ぶ） */
export async function registerKoden(page: Page, name: string, amount: number) {
	await page.getByLabel("氏名").fill(name);
	await page.getByLabel("金額").fill(String(amount));
	await page.getByRole("button", { name: "登録する" }).click();
	// 登録すると同じ画面に戻り、登録した内容を上に出す。次の入力のため氏名の欄にフォーカスがある
	await expect(page.locator("#created-gift")).toContainText(`${name} 様`);
	await expect(page.getByLabel("氏名")).toBeFocused();
}

/** 先頭の Tab で「本文へ移動」が現れ、Enter で本文（#main）へ移る（04 §6） */
export async function expectSkipLink(page: Page) {
	await page.keyboard.press("Tab");
	const skip = page.getByRole("link", { name: "本文へ移動" });
	await expect(skip).toBeFocused();
	await expect(skip).toBeVisible();
	await page.keyboard.press("Enter");
	await expect(page.locator("#main")).toBeFocused();
}
