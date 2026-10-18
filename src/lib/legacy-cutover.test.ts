// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { legacyCutoverResponse } from "./legacy-cutover";

const request = (path: string, init?: { method?: string; headers?: Record<string, string> }) =>
	new NextRequest(`https://old.example.com${path}`, init);

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("legacyCutoverResponse", () => {
	it("どちらも未設定なら通常の処理を続ける", () => {
		vi.stubEnv("MAINTENANCE_MODE", "");
		vi.stubEnv("LEGACY_REDIRECT_ORIGIN", "");

		expect(legacyCutoverResponse(request("/koudens"))).toBeNull();
		expect(legacyCutoverResponse(request("/api/stripe/webhook", { method: "POST" }))).toBeNull();
	});

	describe("MAINTENANCE_MODE=true", () => {
		it("画面をメンテナンス表示にする", async () => {
			vi.stubEnv("MAINTENANCE_MODE", "true");

			const res = legacyCutoverResponse(request("/koudens/abc"));

			expect(res?.status).toBe(503);
			expect(res?.headers.get("retry-after")).toBe("3600");
			expect(await res?.text()).toContain("メンテナンス中");
		});

		it.each([
			["Server Action", "/koudens/abc", "POST", { "next-action": "abc123" }],
			["OAuth のコールバック", "/auth/callback?code=x", "GET", {}],
			["運営者画面", "/admin/users", "POST", {}],
			["Stripe Webhook", "/api/stripe/webhook", "POST", { "stripe-signature": "t=1,v1=x" }],
			["Cron（通知送信）", "/api/cron/send-reminders", "GET", { authorization: "Bearer x" }],
		])("%s を 503 で止める", (_, path, method, headers) => {
			vi.stubEnv("MAINTENANCE_MODE", "true");

			expect(legacyCutoverResponse(request(path, { method, headers }))?.status).toBe(503);
		});

		it("解除すると通常の処理に戻る", () => {
			vi.stubEnv("MAINTENANCE_MODE", "false");

			expect(legacyCutoverResponse(request("/api/stripe/webhook", { method: "POST" }))).toBeNull();
		});
	});

	describe("LEGACY_REDIRECT_ORIGIN", () => {
		it("パスとクエリを保ったまま 301 で転送する", () => {
			vi.stubEnv("LEGACY_REDIRECT_ORIGIN", "https://new.example.com");

			const res = legacyCutoverResponse(request("/koudens/abc?tab=entries"));

			expect(res?.status).toBe(301);
			expect(res?.headers.get("location")).toBe("https://new.example.com/koudens/abc?tab=entries");
		});

		it("メンテナンス中でも転送を優先する", () => {
			vi.stubEnv("MAINTENANCE_MODE", "true");
			vi.stubEnv("LEGACY_REDIRECT_ORIGIN", "https://new.example.com");

			expect(legacyCutoverResponse(request("/"))?.status).toBe(301);
		});

		it("解除すると通常の処理に戻る", () => {
			vi.stubEnv("LEGACY_REDIRECT_ORIGIN", "");

			expect(legacyCutoverResponse(request("/koudens"))).toBeNull();
		});
	});
});
