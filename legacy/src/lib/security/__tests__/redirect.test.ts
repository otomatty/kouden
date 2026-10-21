/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { sanitizeRedirectPath } from "../redirect";

describe("sanitizeRedirectPath", () => {
	it("正常な相対パスはそのまま返す", () => {
		expect(sanitizeRedirectPath("/")).toBe("/");
		expect(sanitizeRedirectPath("/koudens")).toBe("/koudens");
		expect(sanitizeRedirectPath("/koudens/123")).toBe("/koudens/123");
	});

	it("クエリ・ハッシュも保持する", () => {
		expect(sanitizeRedirectPath("/koudens/123?tab=members")).toBe("/koudens/123?tab=members");
		expect(sanitizeRedirectPath("/koudens/123#section")).toBe("/koudens/123#section");
		expect(sanitizeRedirectPath("/koudens/123?x=y#z")).toBe("/koudens/123?x=y#z");
	});

	it("null / undefined / 空文字は null", () => {
		expect(sanitizeRedirectPath(null)).toBeNull();
		expect(sanitizeRedirectPath(undefined)).toBeNull();
		expect(sanitizeRedirectPath("")).toBeNull();
	});

	it("プロトコル相対URLは拒否（オープンリダイレクト対策）", () => {
		expect(sanitizeRedirectPath("//evil.com")).toBeNull();
		expect(sanitizeRedirectPath("//evil.com/path")).toBeNull();
	});

	it("バックスラッシュ始まりは拒否（ブラウザが //evil.com と解釈しうる）", () => {
		expect(sanitizeRedirectPath("\\evil.com")).toBeNull();
		expect(sanitizeRedirectPath("\\\\evil.com")).toBeNull();
	});

	it("スキーム付き絶対URLは拒否", () => {
		expect(sanitizeRedirectPath("https://evil.com")).toBeNull();
		expect(sanitizeRedirectPath("http://evil.com/path")).toBeNull();
		expect(sanitizeRedirectPath("javascript:alert(1)")).toBeNull();
		expect(sanitizeRedirectPath("mailto:x@example.com")).toBeNull();
		expect(sanitizeRedirectPath("data:text/html,abc")).toBeNull();
	});

	it("スラッシュで始まらないパスは拒否", () => {
		expect(sanitizeRedirectPath("koudens")).toBeNull();
		expect(sanitizeRedirectPath("./koudens")).toBeNull();
		expect(sanitizeRedirectPath("../koudens")).toBeNull();
	});
});
