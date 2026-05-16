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
