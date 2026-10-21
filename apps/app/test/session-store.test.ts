import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createSession,
	deleteExpiredSessions,
	loadSession,
	SESSION_TTL_MS,
} from "../src/auth/session-store.ts";

const T0 = new Date("2026-10-01T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const at = (ms: number) => new Date(T0.getTime() + ms);

beforeEach(async () => {
	await env.DB.prepare(
		`INSERT INTO users (id, google_sub, email, display_name, created_at, updated_at)
     VALUES ('u1', 'sub1', 'u1@example.com', 'ユーザー1', ?, ?)`,
	)
		.bind(T0.toISOString(), T0.toISOString())
		.run();
});

describe("session-store", () => {
	it("DB にはトークンそのものではなくハッシュを保存する", async () => {
		const token = await createSession(env.DB, "u1", T0, "test-agent");
		const row = await env.DB.prepare("SELECT token_hash FROM sessions").first<{
			token_hash: string;
		}>();
		expect(row?.token_hash).toMatch(/^[0-9a-f]{64}$/);
		expect(row?.token_hash).not.toBe(token);
	});

	it("有効期限内なら読み込める。1 日未満なら期限を延長しない", async () => {
		const token = await createSession(env.DB, "u1", T0, null);
		const loaded = await loadSession(env.DB, token, at(DAY - 1));
		expect(loaded?.user.displayName).toBe("ユーザー1");
		expect(loaded?.extended).toBe(false);
	});

	it("最終利用から 1 日以上経つと期限を延長する", async () => {
		const token = await createSession(env.DB, "u1", T0, null);
		const loaded = await loadSession(env.DB, token, at(10 * DAY));
		expect(loaded?.extended).toBe(true);
		// 延長されたので、作成から 30 日を過ぎても使える
		expect(await loadSession(env.DB, token, at(35 * DAY))).not.toBeNull();
	});

	it("期限切れのセッションは読み込めず、掃除で消える", async () => {
		const token = await createSession(env.DB, "u1", T0, null);
		const expiredAt = at(SESSION_TTL_MS + 1);
		expect(await loadSession(env.DB, token, expiredAt)).toBeNull();
		expect(await deleteExpiredSessions(env.DB, expiredAt)).toBe(1);
	});

	it("削除済みユーザーのセッションは無効", async () => {
		const token = await createSession(env.DB, "u1", T0, null);
		await env.DB.prepare("UPDATE users SET deleted_at = ? WHERE id = 'u1'")
			.bind(T0.toISOString())
			.run();
		expect(await loadSession(env.DB, token, at(1000))).toBeNull();
	});

	it("存在しないトークンは null", async () => {
		expect(await loadSession(env.DB, "unknown", T0)).toBeNull();
	});
});
