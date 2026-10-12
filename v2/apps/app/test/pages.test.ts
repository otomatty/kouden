import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { safeReturnTo } from "../src/auth/routes.tsx";
import { createApp } from "../src/app.tsx";

const app = createApp();

describe("公開ページ", () => {
	it.each(["/", "/pricing", "/faq", "/terms", "/privacy", "/legal/tokushoho", "/login"])(
		"%s は 200 で HTML を返す",
		async (path) => {
			const res = await app.request(path, {}, env);
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
			expect(html).toContain('<html lang="ja">');
		},
	);

	it("存在しないページは 404", async () => {
		const res = await app.request("/no-such-page", {}, env);
		expect(res.status).toBe(404);
		expect(await res.text()).toContain("ページが見つかりません");
	});

	it("セキュリティヘッダーを付ける", async () => {
		const res = await app.request("/", {}, env);
		const csp = res.headers.get("content-security-policy") ?? "";
		expect(csp).toContain("default-src 'self'");
		expect(csp).toMatch(/script-src 'self' 'nonce-[^']+'/);
		expect(csp).toContain("frame-ancestors 'none'");
		expect(res.headers.get("x-content-type-options")).toBe("nosniff");
	});

	it("ログイン画面のエラー表示は既知のコードだけ", async () => {
		const known = await (await app.request("/login?error=expired", {}, env)).text();
		expect(known).toContain("有効期限が切れました");
		const unknown = await (await app.request("/login?error=<script>", {}, env)).text();
		expect(unknown).not.toContain('role="alert"');
	});
});

describe("safeReturnTo", () => {
	it.each([
		["/k/abc?x=1", "/k/abc?x=1"],
		[undefined, "/"],
		["https://evil.example", "/"],
		["//evil.example", "/"],
		["/\\evil.example", "/"],
		["relative", "/"],
		// ブラウザはタブ・改行を除去するので `//evil.example` になる
		["/\t/evil.example", "/"],
		["/\n/evil.example", "/"],
		["/%09/evil.example", "/%09/evil.example"],
		["/k/abc#gifts", "/k/abc#gifts"],
	])("%s → %s", (input, expected) => {
		expect(safeReturnTo(input)).toBe(expected);
	});
});
