import { env, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { DELETED_USER_NAME } from "../src/auth/account.ts";
import { ledgerFor } from "../src/ledger/client.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

const userIdOf = async (email: string) =>
	(await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>())
		?.id ?? "";

async function createKouden(app: ReturnType<typeof makeApp>, name: string) {
	const created = await app.request("/k", formPost({ deceasedName: name }));
	return created.headers.get("location")?.split("/").pop() ?? "";
}

async function addMember(koudenId: string, userId: string, role: "editor" | "viewer") {
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, ?, '')",
	)
		.bind(koudenId, userId, role)
		.run();
}

describe("表示名の変更（E1-5）", () => {
	it("変更するとヘッダーと以後の操作に使われ、空欄は受け付けない", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const empty = await taro.request("/account/profile", formPost({ displayName: "  " }));
		expect(empty.status).toBe(422);
		expect(await empty.text()).toContain("表示名を入力してください");

		const saved = await taro.request("/account/profile", formPost({ displayName: "山田（長男）" }));
		expect(saved.headers.get("location")).toBe("/account?notice=saved");
		const page = await (await taro.request("/account?notice=saved")).text();
		expect(page).toContain("表示名を保存しました。");
		expect(page).toContain("山田（長男） さん");
	});

	it("ログインしていなければログイン画面へ", async () => {
		const taro = makeApp(TARO);
		const res = await taro.request("/account");
		expect(res.headers.get("location")).toBe("/login?return_to=%2Faccount");
	});
});

describe("アカウントの削除（E1-4）", () => {
	it("オーナーである香典帳が残っている間は削除できない", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const koudenId = await createKouden(taro, "山田 一郎");
		const page = await (await taro.request("/account")).text();
		expect(page).toContain("オーナーである香典帳が 1 冊あります");
		expect(page).toContain(`/k/${koudenId}/settings#delete`);
		expect(page).not.toContain('action="/account/delete"');

		const res = await taro.request("/account/delete", formPost({ confirm: "1" }));
		expect(res.status).toBe(409);
		const row = await env.DB.prepare("SELECT deleted_at FROM users WHERE id = ?")
			.bind(await userIdOf(TARO.email))
			.first<{ deleted_at: string | null }>();
		expect(row?.deleted_at).toBeNull();
	});

	it("確認のチェックがなければ削除しない", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const res = await taro.request("/account/delete", formPost({}));
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("確認の欄にチェックを入れてください");
	});

	it("削除すると匿名化し、メンバー行・セッション・承諾待ちの譲渡を消す。同じ Google アカウントでは新しいアカウントになる", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const koudenId = await createKouden(taro, "山田 一郎");
		const hanako = makeApp(HANAKO);
		await hanako.login();
		const hanakoId = await userIdOf(HANAKO.email);
		await addMember(koudenId, hanakoId, "editor");
		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));

		const res = await hanako.request("/account/delete", formPost({ confirm: "1" }));
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("アカウントを削除しました");

		const user = await env.DB.prepare(
			"SELECT email, display_name, google_sub, avatar_url, deleted_at FROM users WHERE id = ?",
		)
			.bind(hanakoId)
			.first();
		expect(user).toMatchObject({
			email: "",
			display_name: DELETED_USER_NAME,
			google_sub: null,
			avatar_url: null,
		});
		expect(user?.deleted_at).toEqual(expect.any(String));
		const counts = await env.DB.prepare(
			`SELECT (SELECT count(*) FROM kouden_members WHERE user_id = ?1) AS members,
              (SELECT count(*) FROM sessions WHERE user_id = ?1) AS sessions,
              (SELECT count(*) FROM ownership_transfers WHERE to_user_id = ?1 AND status = 'pending') AS pending`,
		)
			.bind(hanakoId)
			.first();
		expect(counts).toEqual({ members: 0, sessions: 0, pending: 0 });

		// ログアウト済み
		expect((await hanako.request(`/k/${koudenId}`)).status).toBe(302);
		// 他のメンバーの画面が取り直せるよう、変更を記録して知らせる
		const logged = await runInDurableObject(ledgerFor(env, koudenId), (_obj, state) =>
			state.storage.sql
				.exec<{ entity: string; entity_id: string; op: string }>(
					"SELECT entity, entity_id, op FROM change_log ORDER BY seq DESC LIMIT 1",
				)
				.toArray(),
		);
		expect(logged).toEqual([{ entity: "member", entity_id: hanakoId, op: "delete" }]);
		// オーナーのメンバー一覧から消える
		expect(await (await taro.request(`/k/${koudenId}/members`)).text()).not.toContain("佐藤 花子");

		// 同じ Google アカウントでログインすると、新しい空のアカウントになる
		const again = makeApp(HANAKO);
		await again.login();
		const newId = await userIdOf(HANAKO.email);
		expect(newId).not.toBe(hanakoId);
		expect((await again.request(`/k/${koudenId}`)).status).toBe(404);
	});

	it("香典帳を削除・譲渡するとアカウントを削除できる", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const koudenId = await createKouden(taro, "山田 一郎");
		await taro.request(`/k/${koudenId}/delete`, formPost({ confirm: "故 山田 一郎 様" }));
		const page = await (await taro.request("/account")).text();
		expect(page).toContain('action="/account/delete"');
		expect((await taro.request("/account/delete", formPost({ confirm: "1" }))).status).toBe(200);
	});
});
