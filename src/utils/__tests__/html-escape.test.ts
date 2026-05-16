/// <reference types="vitest" />
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { escapeHtml, sanitizeHttpsUrl } from "../html-escape";

describe("escapeHtml", () => {
	it("HTML 特殊文字をエスケープする", () => {
		expect(escapeHtml("&")).toBe("&amp;");
		expect(escapeHtml("<")).toBe("&lt;");
		expect(escapeHtml(">")).toBe("&gt;");
		expect(escapeHtml('"')).toBe("&#34;");
		expect(escapeHtml("'")).toBe("&#39;");
	});

	it("& を先にエスケープしてから他の文字をエスケープする (二重エスケープしない)", () => {
		expect(escapeHtml("<&>")).toBe("&lt;&amp;&gt;");
	});

	it("複数の特殊文字を含む文字列を全てエスケープする", () => {
		expect(escapeHtml(`<script>alert('XSS & "attack"')</script>`)).toBe(
			"&lt;script&gt;alert(&#39;XSS &amp; &#34;attack&#34;&#39;)&lt;/script&gt;",
		);
	});

	it("通常文字列はそのまま返す", () => {
		expect(escapeHtml("Hello, world!")).toBe("Hello, world!");
		expect(escapeHtml("田中太郎")).toBe("田中太郎");
		expect(escapeHtml("")).toBe("");
	});

	it("数字や記号など特殊でない文字は変更しない", () => {
		expect(escapeHtml("123-456_789")).toBe("123-456_789");
	});
});

describe("sanitizeHttpsUrl", () => {
	const originalNodeEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalNodeEnv;
	});

	it("https:// で始まる URL はそのまま返す (HTML エスケープ済み)", () => {
		expect(sanitizeHttpsUrl("https://example.com/path")).toBe("https://example.com/path");
	});

	it("https URL に含まれる HTML 特殊文字はエスケープする", () => {
		expect(sanitizeHttpsUrl("https://example.com/?q=<script>")).toBe(
			"https://example.com/?q=&lt;script&gt;",
		);
	});

	it("本番環境では http://example.com を # にフォールバックする", () => {
		process.env.NODE_ENV = "production";
		expect(sanitizeHttpsUrl("http://example.com")).toBe("#");
	});

	it("本番環境では http://localhost も # にフォールバックする", () => {
		process.env.NODE_ENV = "production";
		expect(sanitizeHttpsUrl("http://localhost:3000/path")).toBe("#");
	});

	it("開発環境では http://localhost を許可する", () => {
		process.env.NODE_ENV = "development";
		expect(sanitizeHttpsUrl("http://localhost:3000/invitations/abc")).toBe(
			"http://localhost:3000/invitations/abc",
		);
	});

	it("開発環境でも http://localhost 以外の http は # にフォールバックする", () => {
		process.env.NODE_ENV = "development";
		expect(sanitizeHttpsUrl("http://example.com")).toBe("#");
	});

	it("javascript: スキームを # にフォールバックする (XSS 防止)", () => {
		expect(sanitizeHttpsUrl("javascript:alert(1)")).toBe("#");
	});

	it("data: スキームを # にフォールバックする", () => {
		expect(sanitizeHttpsUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
	});

	it("空文字や相対パスを # にフォールバックする", () => {
		expect(sanitizeHttpsUrl("")).toBe("#");
		expect(sanitizeHttpsUrl("/path/to/resource")).toBe("#");
	});
});
