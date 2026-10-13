import { env } from "cloudflare:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { accessVerifier } from "../src/access.ts";
import { createAdminApp } from "../src/app.tsx";
import { linkLegacyUser } from "../src/store.ts";

const ORIGIN = "http://localhost:5174";
const ISSUER = `https://${env.ACCESS_TEAM_DOMAIN}`;
const ADMIN = "ops@kouden.example";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256" };
const keys = createLocalJWKSet({ keys: [jwk] });

async function token(claims: { email?: string; aud?: string; iss?: string; exp?: string } = {}) {
	return new SignJWT({ email: claims.email ?? ADMIN })
		.setProtectedHeader({ alg: "RS256", kid: "test-key" })
		.setIssuer(claims.iss ?? ISSUER)
		.setAudience(claims.aud ?? env.ACCESS_AUD)
		.setIssuedAt()
		.setExpirationTime(claims.exp ?? "5m")
		.sign(privateKey);
}

const app = createAdminApp({
	verifyAccess: (e) =>
		accessVerifier({ teamDomain: e.ACCESS_TEAM_DOMAIN, aud: e.ACCESS_AUD, keys }),
});

async function request(
	path: string,
	init: RequestInit & { jwt?: string | null; env?: Partial<Env> } = {},
) {
	const headers = new Headers(init.headers);
	const jwt = init.jwt === undefined ? await token() : init.jwt;
	if (jwt) headers.set("Cf-Access-Jwt-Assertion", jwt);
	if (init.method && init.method !== "GET" && !headers.has("origin")) headers.set("origin", ORIGIN);
	return app.request(path, { ...init, headers }, { ...env, ...init.env });
}

const form = (fields: Record<string, string>): RequestInit => ({
	method: "POST",
	headers: { "content-type": "application/x-www-form-urlencoded" },
	body: new URLSearchParams(fields).toString(),
});

// ---- 準備（D1 に直接入れる） ----------------------------------------------------

const NOW = "2026-10-01T00:00:00.000Z";

async function user(
	id: string,
	fields: { email?: string; name?: string; sub?: string | null; legacy?: string } = {},
) {
	await env.DB.prepare(
		`INSERT INTO users (id, google_sub, email, display_name, legacy_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			id,
			fields.sub === undefined ? `sub-${id}` : fields.sub,
			fields.email ?? `${id}@example.com`,
			fields.name ?? id,
			fields.legacy ?? null,
			NOW,
			NOW,
		)
		.run();
}

async function kouden(id: string, owner: string, plan: "free" | "paid" = "free") {
	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO koudens (id, title, deceased_name, owner_user_id, plan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
		).bind(id, `故 ${id} 様`, id, owner, plan, NOW, NOW),
		env.DB.prepare(
			"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)",
		).bind(id, owner, NOW),
	]);
}

async function member(koudenId: string, userId: string, role: "editor" | "viewer") {
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
	)
		.bind(koudenId, userId, role, NOW)
		.run();
}

async function purchase(id: string, koudenId: string, userId: string, source = "stripe") {
	await env.DB.prepare(
		`INSERT INTO purchases (id, kouden_id, user_id, amount, source, status, created_at)
     VALUES (?, ?, ?, 2980, ?, 'paid', ?)`,
	)
		.bind(id, koudenId, userId, source, NOW)
		.run();
}

const planOf = async (id: string) =>
	(await env.DB.prepare("SELECT plan FROM koudens WHERE id = ?").bind(id).first<{ plan: string }>())
		?.plan;

const audits = async () =>
	(
		await env.DB.prepare(
			"SELECT admin_email, action, target_type, target_id FROM admin_audit_logs ORDER BY created_at",
		).all()
	).results;

// ---- テスト ---------------------------------------------------------------------

describe("Cloudflare Access（04 §4）", () => {
	it("有効な JWT なら通し、運営者のメールアドレスを表示する。応答はキャッシュさせない", async () => {
		const res = await request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain(ADMIN);
		expect(res.headers.get("cache-control")).toBe("private, no-store");
	});

	it("JWT がない・署名が違う・aud や iss が違う・期限切れなら 403", async () => {
		const other = await generateKeyPair("RS256");
		const forged = await new SignJWT({ email: ADMIN })
			.setProtectedHeader({ alg: "RS256", kid: "test-key" })
			.setIssuer(ISSUER)
			.setAudience(env.ACCESS_AUD)
			.setExpirationTime("5m")
			.sign(other.privateKey);
		for (const jwt of [
			null,
			"not-a-jwt",
			forged,
			await token({ aud: "other-app" }),
			await token({ iss: "https://evil.cloudflareaccess.com" }),
			await token({ exp: "-1m" }),
			await token({ email: "" }),
		]) {
			expect((await request("/", { jwt })).status).toBe(403);
		}
	});

	it("Access の設定がなければ通さない（迂回しない）", async () => {
		const res = await request("/", { env: { ACCESS_AUD: "" } });
		expect(res.status).toBe(500);
	});

	it("development の運営者（ADMIN_DEV_EMAIL）が設定されていれば JWT なしで通す", async () => {
		const res = await request("/", { jwt: null, env: { ADMIN_DEV_EMAIL: "dev@localhost.test" } });
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("dev@localhost.test");
	});

	it("他のオリジンからの POST は CSRF として拒否する", async () => {
		await user("u1");
		await kouden("k1", "u1");
		const res = await request("/koudens/k1/grant", {
			...form({ reason: "テスト" }),
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				origin: "https://evil.example",
			},
		});
		expect(res.status).toBe(403);
		expect(await planOf("k1")).toBe("free");
	});
});

describe("ダッシュボード・検索（E10-1, E10-4）", () => {
	it("件数・売上・月ごとの推移を出す", async () => {
		await user("u1");
		await user("u2");
		await kouden("k1", "u1", "paid");
		await kouden("k2", "u2");
		await purchase("p1", "k1", "u1");
		await env.DB.prepare(
			`INSERT INTO kouden_stats (kouden_id, gift_count, total_amount, person_count, return_pending,
                                 last_activity_at, projected_seq) VALUES ('k1', 42, 100000, 40, 3, ?, 1)`,
		)
			.bind(new Date().toISOString())
			.run();
		const html = await (await request("/")).text();
		expect(html).toContain("2 人");
		expect(html).toContain("2 / 0");
		expect(html).toContain("¥2,980");
		expect(html).toContain("42 件");
		expect(html).toContain("2026-10");
	});

	it("ユーザー・香典帳をメールアドレス・名前で検索し、詳細にメンバーと購入を出す", async () => {
		await user("u1", { email: "taro@example.com", name: "山田 太郎" });
		await user("u2", { email: "hanako@example.com", name: "佐藤 花子" });
		await kouden("k1", "u1");
		await member("k1", "u2", "editor");
		const search = await (await request("/search?q=taro")).text();
		expect(search).toContain("山田 太郎");
		expect(search).toContain("/koudens/k1");
		expect(search).not.toContain("佐藤 花子");

		const detail = await (await request("/koudens/k1")).text();
		expect(detail).toContain("山田 太郎");
		expect(detail).toContain("hanako@example.com");
		expect(detail).toContain("編集者");
		expect((await request("/users/u2")).status).toBe(200);
		expect((await request("/koudens/none")).status).toBe(404);
	});
});

describe("手動の有料化・購入の取り消し（E10-3）", () => {
	it("有料にすると 0 円の購入を記録し、監査ログに残す。有料の香典帳には重ねない", async () => {
		await user("u1");
		await kouden("k1", "u1");
		const res = await request("/koudens/k1/grant", form({ reason: "不具合の補償" }));
		expect(res.headers.get("location")).toBe("/koudens/k1?notice=granted");
		expect(await planOf("k1")).toBe("paid");
		const rows = (
			await env.DB.prepare("SELECT amount, source, status, user_id FROM purchases").all()
		).results;
		expect(rows).toEqual([{ amount: 0, source: "admin", status: "paid", user_id: "u1" }]);
		expect(await audits()).toEqual([
			{ admin_email: ADMIN, action: "kouden.grant_paid", target_type: "kouden", target_id: "k1" },
		]);

		const again = await request("/koudens/k1/grant", form({ reason: "二度押し" }));
		expect(again.headers.get("location")).toBe("/koudens/k1?error=already_paid");
		expect(await audits()).toHaveLength(1);
	});

	it("理由がなければ操作しない", async () => {
		await user("u1");
		await kouden("k1", "u1");
		const res = await request("/koudens/k1/grant", form({ reason: " " }));
		expect(res.headers.get("location")).toBe("/koudens/k1?error=reason");
		expect(await planOf("k1")).toBe("free");
	});

	it("同じ時刻に二度送られても、取り消しの監査ログは 1 件だけ", async () => {
		await user("u1");
		await kouden("k1", "u1", "paid");
		await purchase("p1", "k1", "u1");
		const fixed = new Date("2026-10-01T00:00:00.000Z");
		const frozen = createAdminApp({
			now: () => fixed,
			verifyAccess: (e) =>
				accessVerifier({ teamDomain: e.ACCESS_TEAM_DOMAIN, aud: e.ACCESS_AUD, keys }),
		});
		const send = async () =>
			frozen.request(
				"/purchases/p1/revoke",
				{
					...form({ reason: "二度押し" }),
					headers: {
						"content-type": "application/x-www-form-urlencoded",
						origin: ORIGIN,
						"Cf-Access-Jwt-Assertion": await token(),
					},
				},
				env,
			);
		expect((await send()).headers.get("location")).toBe("/koudens/k1?notice=revoked_downgraded");
		expect((await send()).headers.get("location")).toBe("/koudens/k1?error=already_refunded");
		expect(await audits()).toHaveLength(1);
	});

	it("取り消すと、有効な購入が残っていなければ無料に戻す。二度目は何もしない", async () => {
		await user("u1");
		await kouden("k1", "u1", "paid");
		await purchase("p1", "k1", "u1");
		await purchase("p2", "k1", "u1", "admin");

		const first = await request("/purchases/p1/revoke", form({ reason: "二重決済" }));
		expect(first.headers.get("location")).toBe("/koudens/k1?notice=revoked");
		expect(await planOf("k1")).toBe("paid");

		const second = await request("/purchases/p2/revoke", form({ reason: "補償の取り消し" }));
		expect(second.headers.get("location")).toBe("/koudens/k1?notice=revoked_downgraded");
		expect(await planOf("k1")).toBe("free");

		const again = await request("/purchases/p2/revoke", form({ reason: "二度押し" }));
		expect(again.headers.get("location")).toBe("/koudens/k1?error=already_refunded");
		expect((await audits()).map((a) => a.target_id)).toEqual(["p1", "p2"]);
	});
});

async function setupLegacy() {
	// 旧ユーザー（移行で作った行。Google の sub はまだない）
	await user("legacy-u", {
		email: "taro@docomo.example",
		name: "山田 太郎",
		sub: null,
		legacy: "old-1",
	});
	await env.DB.prepare(
		`INSERT INTO legacy_users (legacy_user_id, email, display_name, auth_provider)
       VALUES ('old-1', 'taro@docomo.example', '山田 太郎', 'email')`,
	).run();
	await kouden("k-old", "legacy-u", "paid");
	// 本人が新しく Google でログインしたアカウント（空のアカウントとして作られた）
	await user("new-u", { email: "taro.new@gmail.com", name: "Taro", sub: "google-sub-taro" });
	await kouden("k-new", "new-u");
	await purchase("p-new", "k-new", "new-u");
	await env.DB.prepare(
		`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at)
       VALUES ('h', 'new-u', ?, '2099-01-01T00:00:00Z', ?)`,
	)
		.bind(NOW, NOW)
		.run();
	// 両方が参加している香典帳（新しいアカウントがオーナー）
	await user("other", { email: "other@example.com" });
	await kouden("k-both", "new-u");
	await member("k-both", "legacy-u", "editor");
	// 両方が参加している香典帳（旧アカウントが閲覧者、新しいアカウントが編集者）
	await kouden("k-shared", "other");
	await member("k-shared", "legacy-u", "viewer");
	await member("k-shared", "new-u", "editor");
	await env.DB.prepare(
		"UPDATE kouden_members SET notify_reminders = 1 WHERE kouden_id = 'k-shared' AND user_id = 'new-u'",
	).run();
	// 旧アカウントに残っているセッション（あれば消す）
	await env.DB.prepare(
		`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at)
     VALUES ('h-legacy', 'legacy-u', ?, '2099-01-01T00:00:00Z', ?)`,
	)
		.bind(NOW, NOW)
		.run();
}

describe("旧ユーザーの手動紐づけ（E10-2）", () => {
	it("一覧・候補の検索から紐づけ、新しいアカウントのログイン・香典帳・購入を旧アカウントに寄せる", async () => {
		await setupLegacy();
		const list = await (await request("/legacy")).text();
		expect(list).toContain("taro@docomo.example");
		expect(list).toContain("/legacy/old-1/link");
		const confirm = await (await request("/legacy/old-1/link?email=taro.new@gmail.com")).text();
		expect(confirm).toContain("taro.new@gmail.com");
		expect(confirm).toContain('value="new-u"');

		const res = await request("/legacy/old-1/link", form({ targetUserId: "new-u" }));
		expect(res.headers.get("location")).toBe("/users/legacy-u?notice=linked");

		const users = (
			await env.DB.prepare(
				"SELECT id, google_sub, email, deleted_at IS NOT NULL AS deleted FROM users WHERE id IN ('legacy-u', 'new-u') ORDER BY id",
			).all()
		).results;
		expect(users).toEqual([
			{ id: "legacy-u", google_sub: "google-sub-taro", email: "taro.new@gmail.com", deleted: 0 },
			{ id: "new-u", google_sub: null, email: "", deleted: 1 },
		]);
		const members = (
			await env.DB.prepare(
				"SELECT kouden_id, user_id, role FROM kouden_members ORDER BY kouden_id",
			).all()
		).results;
		expect(members).toEqual([
			{ kouden_id: "k-both", user_id: "legacy-u", role: "owner" },
			{ kouden_id: "k-new", user_id: "legacy-u", role: "owner" },
			{ kouden_id: "k-old", user_id: "legacy-u", role: "owner" },
			{ kouden_id: "k-shared", user_id: "legacy-u", role: "editor" },
			{ kouden_id: "k-shared", user_id: "other", role: "owner" },
		]);
		const owners = (await env.DB.prepare("SELECT id, owner_user_id FROM koudens ORDER BY id").all())
			.results;
		// 新しいアカウントで選んでいた期限のお知らせも引き継ぐ
		expect(
			await env.DB.prepare(
				"SELECT notify_reminders FROM kouden_members WHERE kouden_id = 'k-shared' AND user_id = 'legacy-u'",
			).first(),
		).toEqual({ notify_reminders: 1 });
		expect(owners).toEqual([
			{ id: "k-both", owner_user_id: "legacy-u" },
			{ id: "k-new", owner_user_id: "legacy-u" },
			{ id: "k-old", owner_user_id: "legacy-u" },
			{ id: "k-shared", owner_user_id: "other" },
		]);
		expect(
			await env.DB.prepare("SELECT user_id FROM purchases WHERE id = 'p-new'").first(),
		).toEqual({ user_id: "legacy-u" });
		expect(
			await env.DB.prepare(
				"SELECT count(*) AS n FROM sessions WHERE user_id IN ('new-u', 'legacy-u')",
			).first(),
		).toEqual({ n: 0 });
		expect(
			await env.DB.prepare(
				"SELECT linked_user_id, linked_by FROM legacy_users WHERE legacy_user_id = 'old-1'",
			).first(),
		).toEqual({ linked_user_id: "legacy-u", linked_by: ADMIN });
		expect(await audits()).toEqual([
			{
				admin_email: ADMIN,
				action: "legacy_user.link",
				target_type: "legacy_user",
				target_id: "old-1",
			},
		]);
	});

	it("同じ時刻に別のアカウントへの紐づけが重なっても、負けた側のアカウントには触らない", async () => {
		await setupLegacy();
		await user("new-2", { email: "taro.other@gmail.com", sub: "google-sub-other" });
		const at = new Date("2026-10-01T00:00:00.000Z");
		const results = await Promise.all([
			linkLegacyUser(
				env.DB,
				{ legacyUserId: "old-1", targetUserId: "new-u", adminEmail: ADMIN },
				at,
			),
			linkLegacyUser(
				env.DB,
				{ legacyUserId: "old-1", targetUserId: "new-2", adminEmail: "b@x" },
				at,
			),
		]);
		expect(results.filter((r) => r.ok)).toHaveLength(1);
		const losers = (
			await env.DB.prepare(
				"SELECT id, google_sub, deleted_at FROM users WHERE id IN ('new-u', 'new-2') AND deleted_at IS NULL",
			).all()
		).results;
		// 負けた側は削除されず、Google の sub も残る
		expect(losers).toHaveLength(1);
		expect(losers[0]?.google_sub).toEqual(expect.stringMatching(/^google-sub-/));
		expect(await audits()).toHaveLength(1);
	});

	it("紐づけ済み・紐づけできない相手には何もしない", async () => {
		await setupLegacy();
		// 旧アカウント自身・存在しないアカウントは紐づけ先にできない
		for (const targetUserId of ["legacy-u", "missing"]) {
			const res = await request("/legacy/old-1/link", form({ targetUserId }));
			expect(res.status).toBe(409);
			expect(await res.text()).toContain("紐づけできないアカウント");
		}
		await request("/legacy/old-1/link", form({ targetUserId: "new-u" }));
		await user("new-2", { email: "x@gmail.com", sub: "sub-x" });
		const again = await request("/legacy/old-1/link", form({ targetUserId: "new-2" }));
		expect(again.status).toBe(409);
		expect(await again.text()).toContain("すでに紐づけ済みです");
		expect(await audits()).toHaveLength(1);
	});
});
