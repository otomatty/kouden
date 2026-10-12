import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { makeApp, TARO } from "./helpers.ts";

async function countSessions(userId: string): Promise<number> {
	const row = await env.DB.prepare("SELECT count(*) AS n FROM sessions WHERE user_id = ?")
		.bind(userId)
		.first<{ n: number }>();
	return row?.n ?? 0;
}

describe("Google ログイン", () => {
	it("初回ログインでユーザーとセッションが作られ、元の画面へ戻る", async () => {
		const { request, login, jar, seen } = makeApp(TARO);

		const res = await login("/pricing");

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("/pricing");
		expect(jar.has("__Host-kouden_session")).toBe(true);
		expect(jar.has("__Host-kouden_oauth")).toBe(false);
		expect(seen.nonce).toBeTruthy();
		expect(seen.codeVerifier).toBeTruthy();

		const user = await env.DB.prepare("SELECT * FROM users WHERE google_sub = ?")
			.bind(TARO.sub)
			.first<{ id: string; display_name: string; email: string }>();
		expect(user?.display_name).toBe("山田 太郎");
		expect(user?.email).toBe("taro@example.com");

		const home = await request("/");
		expect(await home.text()).toContain("山田 太郎");
	});

	it("2 回目のログインでは同じユーザーを使い、メールと画像を更新する", async () => {
		const first = makeApp(TARO);
		await first.login();
		const second = makeApp({ ...TARO, email: "new@example.com" });
		await second.login();

		const { results } = await env.DB.prepare("SELECT email FROM users WHERE google_sub = ?")
			.bind(TARO.sub)
			.all<{ email: string }>();
		expect(results).toEqual([{ email: "new@example.com" }]);
	});

	it("state が一致しなければ失敗する", async () => {
		const { request } = makeApp(TARO);
		await request("/auth/google/start");

		const res = await request("/auth/google/callback?code=x&state=forged");

		expect(res.headers.get("location")).toBe("/login?error=failed");
		const user = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?")
			.bind(TARO.sub)
			.first();
		expect(user).toBeNull();
	});

	it("OAuth Cookie がなければ期限切れとして扱う", async () => {
		const { request } = makeApp(TARO);
		const res = await request("/auth/google/callback?code=x&state=y");
		expect(res.headers.get("location")).toBe("/login?error=expired");
	});

	it("Google 側でキャンセルされたらログイン画面に戻す", async () => {
		const { request } = makeApp(TARO);
		await request("/auth/google/start");
		const res = await request("/auth/google/callback?error=access_denied");
		expect(res.headers.get("location")).toBe("/login?error=cancelled");
	});

	it("外部サイトへの return_to は無視する", async () => {
		const { login } = makeApp(TARO);
		const res = await login("//evil.example/path");
		expect(res.headers.get("location")).toBe("/");
	});
});

async function seedLegacyEmailUser(email: string) {
	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO users (id, google_sub, email, display_name, legacy_user_id, created_at, updated_at)
         VALUES ('legacy-user-1', NULL, ?, '旧ユーザー', 'supabase-uid-1', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')`,
		).bind(email),
		env.DB.prepare(
			`INSERT INTO legacy_users (legacy_user_id, email, display_name, auth_provider)
         VALUES ('supabase-uid-1', ?, '旧ユーザー', 'email')`,
		).bind(email),
	]);
}

describe("旧アプリのユーザーの紐づけ", () => {
	it("確認済みメールが一致すれば旧アカウントに紐づく（表示名は旧データを維持）", async () => {
		await seedLegacyEmailUser("Taro@Example.com");
		const { login } = makeApp(TARO);

		await login();

		const user = await env.DB.prepare(
			"SELECT id, google_sub, display_name FROM users WHERE id = 'legacy-user-1'",
		).first<{ id: string; google_sub: string; display_name: string }>();
		expect(user?.google_sub).toBe(TARO.sub);
		expect(user?.display_name).toBe("旧ユーザー");
		const legacy = await env.DB.prepare(
			"SELECT linked_user_id, linked_by FROM legacy_users",
		).first();
		expect(legacy).toEqual({ linked_user_id: "legacy-user-1", linked_by: "auto" });
		expect(await countSessions("legacy-user-1")).toBe(1);
	});

	it("メールが未確認なら紐づけず、新しいユーザーを作る", async () => {
		await seedLegacyEmailUser(TARO.email);
		const { login } = makeApp({ ...TARO, emailVerified: false });

		await login();

		const legacy = await env.DB.prepare(
			"SELECT google_sub FROM users WHERE id = 'legacy-user-1'",
		).first();
		expect(legacy).toEqual({ google_sub: null });
		const created = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?")
			.bind(TARO.sub)
			.first();
		expect(created).not.toBeNull();
	});
});

describe("ログアウト", () => {
	it("ログアウトするとセッションが消え、トップは LP に戻る", async () => {
		const { request, login, jar } = makeApp(TARO);
		await login();

		const res = await request("/logout", { method: "POST" });

		expect(res.status).toBe(302);
		expect(jar.has("__Host-kouden_session")).toBe(false);
		const home = await (await request("/")).text();
		expect(home).toContain("Google アカウントで始める");
	});

	it("すべての端末からログアウトすると、他端末のセッションも消える", async () => {
		const deviceA = makeApp(TARO);
		const deviceB = makeApp(TARO);
		await deviceA.login();
		await deviceB.login();
		const user = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?")
			.bind(TARO.sub)
			.first<{ id: string }>();
		expect(await countSessions(user?.id ?? "")).toBe(2);

		await deviceA.request("/logout/all", { method: "POST" });

		expect(await countSessions(user?.id ?? "")).toBe(0);
		expect(await (await deviceB.request("/")).text()).toContain("Google アカウントで始める");
	});

	it("Origin のない POST は CSRF として拒否する", async () => {
		const { app } = makeApp(TARO);
		const res = await app.request("/logout", { method: "POST" }, env);
		expect(res.status).toBe(403);
	});

	it("未ログインで /logout/all を呼ぶとログイン画面へ誘導する", async () => {
		const { request } = makeApp(TARO);
		const res = await request("/logout/all", { method: "POST" });
		expect(res.headers.get("location")).toBe("/login");
	});
});
