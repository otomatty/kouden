import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.tsx";
import { cloudflareMailer } from "../src/lib/mailer.ts";

const staging = {
	...env,
	APP_ACCESS_REQUIRED: "true",
	APP_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
	APP_ACCESS_AUD: "app-aud",
	IMPORT_DEV_TOKEN: "",
	IMPORT_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
	IMPORT_ACCESS_AUD: "import-aud",
};

describe("staging の Access", () => {
	const app = createApp({
		verifyAppAccess: () => async (token) => token === "app-jwt",
		verifyImportAccess: () => async (token) => token === "import-jwt",
	});
	const get = (path: string, token = "") =>
		app.request(
			path,
			{
				headers: token ? { "Cf-Access-Jwt-Assertion": token } : {},
			},
			staging,
		);

	it("トップ・ログイン・ヘルスチェック・台帳を、Access 未認証では表示しない", async () => {
		for (const path of ["/", "/login", "/healthz", "/k/test", "/internal/import-other"]) {
			expect((await get(path)).status).toBe(403);
		}
		expect((await get("/healthz", "app-jwt")).status).toBe(200);
		expect((await get("/healthz", "import-jwt")).status).toBe(403);
	});

	it("取り込み口は利用者向け Access とは別に認証する", async () => {
		expect((await get("/internal/import/summary")).status).toBe(403);
		expect((await get("/internal/import/summary", "app-jwt")).status).toBe(403);
		expect((await get("/internal/import/summary", "import-jwt")).status).toBe(200);
	});

	it("Stripe の Webhook だけは Access なしで届き、署名で検証される", async () => {
		const post = { method: "POST", body: "{}" };
		expect((await app.request("/webhooks/stripe", post, staging)).status).toBe(400);
		expect((await app.request("/webhooks/stripe-other", post, staging)).status).toBe(403);
		expect((await get("/webhooks/stripe")).status).toBe(403);
	});

	it("Access の設定が消えた場合も公開しない", async () => {
		const response = await app.request("/healthz", {}, { ...staging, APP_ACCESS_AUD: "" });
		expect(response.status).toBe(503);
	});

	it("メール未設定の staging から送信しない", async () => {
		await expect(
			cloudflareMailer({ ...env, MAIL_FROM: "" }).send({
				to: "test@example.com",
				subject: "test",
				text: "test",
			}),
		).rejects.toThrow("Email is not configured");
	});
});
