/// <reference types="vitest" />
import { afterEach, describe, expect, it, vi } from "vitest";

// `logger` を no-op に差し替え (test 出力に警告ログが混ざらないようにする)
vi.mock("@/lib/logger", () => ({
	default: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

function buildRequest(headers: Record<string, string> = {}) {
	const h = new Headers();
	for (const [k, v] of Object.entries(headers)) h.set(k, v);
	return { headers: h } as unknown as Parameters<
		typeof import("../ip-restrictions").isAllowedAdminIP
	>[0];
}

async function freshIsAllowedAdminIP() {
	vi.resetModules();
	const mod = await import("../ip-restrictions");
	return mod.isAllowedAdminIP;
}

/**
 * `vi.stubEnv` で更新した環境変数を反映した状態で `verifyBasicAuth` を
 * 再評価するため、モジュールキャッシュを破棄して再 import する。
 * 各テストはこのヘルパー経由で取得した関数を使うことで、前のテストの
 * env が漏れないクリーンなモジュールインスタンスで検証できる。
 */
async function freshVerifyBasicAuth() {
	vi.resetModules();
	const mod = await import("../ip-restrictions");
	return mod.verifyBasicAuth;
}

/**
 * 指定した資格情報から Basic 認証の `Authorization` ヘッダー値を生成する。
 * `user:pass` を UTF-8 で base64 エンコードし、"Basic <base64>" 形式で返す。
 */
function basicAuthHeader(user: string, pass: string): string {
	return `Basic ${Buffer.from(`${user}:${pass}`, "utf-8").toString("base64")}`;
}

describe("isAllowedAdminIP", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("ADMIN_IP_RESTRICTION=off の場合は true (NODE_ENV に依存しない)", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("ADMIN_IP_RESTRICTION", "off");
		vi.stubEnv("ALLOWED_ADMIN_IPS", "");

		const isAllowedAdminIP = await freshIsAllowedAdminIP();
		expect(isAllowedAdminIP(buildRequest({ "x-forwarded-for": "1.2.3.4" }))).toBe(true);
	});

	it("ADMIN_IP_RESTRICTION 未設定なら NODE_ENV=development でも IP チェックは走る", async () => {
		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("ADMIN_IP_RESTRICTION", "");
		vi.stubEnv("ALLOWED_ADMIN_IPS", ""); // 許可リスト未設定 → 拒否

		const isAllowedAdminIP = await freshIsAllowedAdminIP();
		expect(isAllowedAdminIP(buildRequest({ "x-forwarded-for": "1.2.3.4" }))).toBe(false);
	});

	it("ALLOWED_ADMIN_IPS に含まれる IP は許可される", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("ADMIN_IP_RESTRICTION", "");
		vi.stubEnv("ALLOWED_ADMIN_IPS", "1.2.3.4,5.6.7.8");

		const isAllowedAdminIP = await freshIsAllowedAdminIP();
		expect(isAllowedAdminIP(buildRequest({ "x-forwarded-for": "1.2.3.4" }))).toBe(true);
		expect(isAllowedAdminIP(buildRequest({ "x-forwarded-for": "9.9.9.9" }))).toBe(false);
	});

	it("クライアントIPが取得できない場合は拒否する", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("ADMIN_IP_RESTRICTION", "");
		vi.stubEnv("ALLOWED_ADMIN_IPS", "1.2.3.4");

		const isAllowedAdminIP = await freshIsAllowedAdminIP();
		expect(isAllowedAdminIP(buildRequest({}))).toBe(false);
	});
});

describe("verifyBasicAuth", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("Authorization ヘッダーが無い場合は false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(verifyBasicAuth(buildRequest({}))).toBe(false);
	});

	it("Basic 以外のスキームは false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(verifyBasicAuth(buildRequest({ authorization: "Bearer abc" }))).toBe(false);
	});

	it("デコード後にコロンが無い場合は false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const noColon = `Basic ${Buffer.from("adminonly", "utf-8").toString("base64")}`;
		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(verifyBasicAuth(buildRequest({ authorization: noColon }))).toBe(false);
	});

	it("環境変数が未設定なら false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(
			verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("admin", "secret") })),
		).toBe(false);
	});

	it("正しい資格情報なら true", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(
			verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("admin", "secret") })),
		).toBe(true);
	});

	it("ユーザー名が違うと false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(
			verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("guest", "secret") })),
		).toBe(false);
	});

	it("パスワードが違うと false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(
			verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("admin", "wrong") })),
		).toBe(false);
	});

	it("Basic の後に base64 部分が無い場合は false", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "secret");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		// 空 base64: コロンが見つからず indexOf === -1 で弾かれる
		expect(verifyBasicAuth(buildRequest({ authorization: "Basic " }))).toBe(false);
		// "Basic" のみ (末尾スペース無し): "Basic " で始まらないので即 false
		expect(verifyBasicAuth(buildRequest({ authorization: "Basic" }))).toBe(false);
	});

	it("パスワードにコロンが含まれていても正しく検証できる", async () => {
		vi.stubEnv("ADMIN_BASIC_USERNAME", "admin");
		vi.stubEnv("ADMIN_BASIC_PASSWORD", "pa:ss:wo:rd");

		const verifyBasicAuth = await freshVerifyBasicAuth();
		expect(
			verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("admin", "pa:ss:wo:rd") })),
		).toBe(true);
		expect(verifyBasicAuth(buildRequest({ authorization: basicAuthHeader("admin", "pa") }))).toBe(
			false,
		);
	});
});
