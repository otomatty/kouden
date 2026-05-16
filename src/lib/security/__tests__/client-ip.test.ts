/// <reference types="vitest" />
import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIPFromHeaders, isValidIP } from "../client-ip";

function buildHeaders(entries: Record<string, string>): Headers {
	const headers = new Headers();
	for (const [name, value] of Object.entries(entries)) {
		headers.set(name, value);
	}
	return headers;
}

describe("isValidIP", () => {
	it("IPv4 を許可する", () => {
		expect(isValidIP("1.2.3.4")).toBe(true);
		expect(isValidIP("255.255.255.255")).toBe(true);
		expect(isValidIP("0.0.0.0")).toBe(true);
	});

	it("不正な IPv4 を拒否する", () => {
		expect(isValidIP("256.1.1.1")).toBe(false);
		expect(isValidIP("1.2.3")).toBe(false);
		expect(isValidIP("a.b.c.d")).toBe(false);
		expect(isValidIP("1.2.3.4.5")).toBe(false);
	});

	it("IPv6 (簡易) を許可する", () => {
		expect(isValidIP("::1")).toBe(true);
		expect(isValidIP("2001:db8::1")).toBe(true);
		expect(isValidIP("fe80::1")).toBe(true);
	});

	it("IPv6 風でない文字列を拒否する", () => {
		expect(isValidIP("hello")).toBe(false);
		expect(isValidIP("")).toBe(false);
	});
});

describe("getClientIPFromHeaders ヘッダー優先順位", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("x-vercel-forwarded-for を最優先で採用する", () => {
		const headers = buildHeaders({
			"x-vercel-forwarded-for": "1.2.3.4",
			"cf-connecting-ip": "5.6.7.8",
			"x-forwarded-for": "9.9.9.9, 8.8.8.8",
			"x-real-ip": "7.7.7.7",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});

	it("Vercel ヘッダー欠落時は cf-connecting-ip を採用する", () => {
		const headers = buildHeaders({
			"cf-connecting-ip": "5.6.7.8",
			"x-forwarded-for": "9.9.9.9",
			"x-real-ip": "7.7.7.7",
		});
		expect(getClientIPFromHeaders(headers)).toBe("5.6.7.8");
	});

	it("信頼ヘッダーが無ければ x-forwarded-for を採用する", () => {
		const headers = buildHeaders({
			"x-forwarded-for": "5.6.7.8",
			"x-real-ip": "7.7.7.7",
		});
		expect(getClientIPFromHeaders(headers)).toBe("5.6.7.8");
	});

	it("最終フォールバックとして x-real-ip を採用する", () => {
		const headers = buildHeaders({
			"x-real-ip": "7.7.7.7",
		});
		expect(getClientIPFromHeaders(headers)).toBe("7.7.7.7");
	});

	it("何も無ければ null を返す", () => {
		expect(getClientIPFromHeaders(new Headers())).toBeNull();
	});
});

describe("x-forwarded-for の右端採用ロジック", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("TRUSTED_PROXY_HOPS=1 (デフォルト) では最右端を採用する", () => {
		const headers = buildHeaders({
			// 詐称された左端 + 本物の右端 (信頼プロキシが付与)
			"x-forwarded-for": "9.9.9.9, 8.8.8.8, 1.2.3.4",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});

	it("詐称された左端は採用しない (回避不能)", () => {
		const headers = buildHeaders({
			// 攻撃者が "X-Forwarded-For: 9.9.9.9" を送り込み、信頼プロキシが 1.2.3.4 を追記
			"x-forwarded-for": "9.9.9.9, 1.2.3.4",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});

	it("TRUSTED_PROXY_HOPS=2 で右から 2 番目を採用する", () => {
		vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
		const headers = buildHeaders({
			"x-forwarded-for": "1.2.3.4, 5.5.5.5",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});

	it("hop 数が要素数を超える場合は null (詐称耐性優先)", () => {
		vi.stubEnv("TRUSTED_PROXY_HOPS", "3");
		const headers = buildHeaders({
			"x-forwarded-for": "1.2.3.4, 5.5.5.5",
		});
		// XFF からは取れず、他のヘッダも無いので null
		expect(getClientIPFromHeaders(headers)).toBeNull();
	});

	it("IPv4 のポート付き値もパースできる", () => {
		const headers = buildHeaders({
			"x-forwarded-for": "1.2.3.4:5678",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});

	it("ブラケット付き IPv6 + ポートをパースできる", () => {
		const headers = buildHeaders({
			"x-forwarded-for": "[2001:db8::1]:8080",
		});
		expect(getClientIPFromHeaders(headers)).toBe("2001:db8::1");
	});

	it("不正な IP 値しかなければ次の候補にフォールバックする", () => {
		const headers = buildHeaders({
			"x-forwarded-for": "not-an-ip",
			"x-real-ip": "7.7.7.7",
		});
		expect(getClientIPFromHeaders(headers)).toBe("7.7.7.7");
	});

	it("空白のみのエントリは無視する", () => {
		const headers = buildHeaders({
			"x-forwarded-for": "  ,  , 1.2.3.4",
		});
		expect(getClientIPFromHeaders(headers)).toBe("1.2.3.4");
	});
});
