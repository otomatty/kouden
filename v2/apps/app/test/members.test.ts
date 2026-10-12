import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { acceptInvitation, cleanupMembership, createInvitation } from "../src/kouden/members.ts";
import { maskPath } from "../src/middleware/request-context.ts";
import { formPost, HANAKO, JIRO, makeApp, TARO } from "./helpers.ts";

async function userId(email: string): Promise<string> {
	const row = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
		.bind(email)
		.first<{ id: string }>();
	return row?.id ?? "";
}

async function role(koudenId: string, email: string): Promise<string | null> {
	const row = await env.DB.prepare(
		"SELECT m.role FROM kouden_members m JOIN users u ON u.id = m.user_id WHERE m.kouden_id = ? AND u.email = ?",
	)
		.bind(koudenId, email)
		.first<{ role: string }>();
	return row?.role ?? null;
}

/** 太郎が香典帳を作り、招待リンクを作成して URL を返す */
async function setup(fields: Record<string, string> = {}) {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const invite = async (extra: Record<string, string> = fields) => {
		const res = await taro.request(
			`/k/${koudenId}/invitations`,
			formPost({ role: "editor", expiresInDays: "7", maxUses: "", ...extra }),
		);
		expect(res.status).toBe(200);
		const html = await res.text();
		const url = /id="invite-url"[^>]*value="([^"]+)"/.exec(html)?.[1] ?? "";
		expect(url).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/);
		expect(html).toContain("data:image/svg+xml;base64,");
		return new URL(url).pathname;
	};
	return { taro, koudenId, invite };
}

async function join(claims: typeof HANAKO, invitePath: string) {
	const client = makeApp(claims);
	await client.login();
	const res = await client.request(invitePath, formPost({}));
	return { client, res };
}

describe("招待リンク", () => {
	it("ログイン前は香典帳名とログインボタン、参加すると受付画面へ", async () => {
		const { koudenId, invite } = await setup();
		const path = await invite();

		const anon = makeApp(HANAKO);
		const page = await (await anon.request(path)).text();
		expect(page).toContain("故 山田 一郎 様");
		expect(page).toContain(`/auth/google/start?return_to=${encodeURIComponent(path)}`);

		const { client, res } = await join(HANAKO, path);
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toBe(`/k/${koudenId}/reception`);
		expect(await role(koudenId, HANAKO.email)).toBe("editor");
		// もう一度開くとそのまま香典帳へ
		const again = await client.request(path);
		expect(again.headers.get("location")).toBe(`/k/${koudenId}`);
	});

	it("GET では参加しない（確認ボタンを押したときだけ）", async () => {
		const { koudenId, invite } = await setup();
		const path = await invite();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		const page = await hanako.request(path);
		expect(page.status).toBe(200);
		expect(await page.text()).toContain("参加する");
		expect(await role(koudenId, HANAKO.email)).toBeNull();
	});

	it("閲覧者として招待すると閲覧者で参加し、トップへ", async () => {
		const { koudenId, invite } = await setup();
		const path = await invite({ role: "viewer" });
		const { res } = await join(HANAKO, path);
		expect(res.headers.get("location")).toBe(`/k/${koudenId}`);
		expect(await role(koudenId, HANAKO.email)).toBe("viewer");
	});

	it("使用回数の上限を超えて参加できない（同時に受けても）", async () => {
		const { koudenId, invite } = await setup();
		const path = await invite({ maxUses: "1" });
		const hanako = makeApp(HANAKO);
		const jiro = makeApp(JIRO);
		await hanako.login();
		await jiro.login();
		const results = await Promise.all([
			hanako.request(path, formPost({})),
			jiro.request(path, formPost({})),
		]);
		expect(results.map((r) => r.status).toSorted()).toEqual([303, 409]);
		const joined = [await role(koudenId, HANAKO.email), await role(koudenId, JIRO.email)];
		expect(joined.filter(Boolean)).toHaveLength(1);
		const used = await env.DB.prepare("SELECT used_count FROM invitations").first("used_count");
		expect(used).toBe(1);
	});

	it("同じ人が同時に受けても（二度押しなど）使用回数は 1 回だけ増える", async () => {
		const { koudenId, invite } = await setup();
		await invite({ maxUses: "5" });
		const hanako = makeApp(HANAKO);
		await hanako.login();
		const invitationId =
			(await env.DB.prepare("SELECT id FROM invitations").first<string>("id")) ?? "";
		const hanakoId = await userId(HANAKO.email);
		// 同じ時刻（ミリ秒）に 2 回受けた場合: 2 回目の参加は何もしないので、回数も増やさない
		const now = new Date();
		expect(await acceptInvitation(env.DB, invitationId, hanakoId, now)).toBe(true);
		expect(await acceptInvitation(env.DB, invitationId, hanakoId, now)).toBe(false);
		expect(await env.DB.prepare("SELECT used_count FROM invitations").first("used_count")).toBe(1);
		expect(await role(koudenId, HANAKO.email)).toBe("editor");
	});

	it("無効にした招待・期限切れの招待では参加できない", async () => {
		const { taro, koudenId, invite } = await setup();
		const path = await invite();
		const invitationId = await env.DB.prepare("SELECT id FROM invitations").first<string>("id");
		await taro.request(`/k/${koudenId}/invitations/${invitationId}/revoke`, formPost({}));
		const revoked = await join(HANAKO, path);
		expect(revoked.res.status).toBe(409);
		expect(await revoked.res.text()).toContain("無効になっています");

		const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
		const { token } = await createInvitation(env.DB, {
			koudenId,
			role: "editor",
			maxUses: null,
			expiresInDays: 1,
			createdBy: await userId(TARO.email),
			now: past,
		});
		const expired = await join(JIRO, `/invite/${token}`);
		expect(expired.res.status).toBe(409);
		expect(await expired.res.text()).toContain("有効期限が切れています");
		expect(await role(koudenId, JIRO.email)).toBeNull();
	});

	it("招待の画面は参照元を送らない（失敗した参加の画面も）", async () => {
		const { invite } = await setup({ maxUses: "1" });
		const path = await invite();
		expect((await makeApp(HANAKO).request(path)).headers.get("referrer-policy")).toBe(
			"no-referrer",
		);
		await join(HANAKO, path);
		const { res } = await join(JIRO, path);
		expect(res.status).toBe(409);
		expect(res.headers.get("referrer-policy")).toBe("no-referrer");
	});

	it("存在しない招待は 404", async () => {
		const anon = makeApp(HANAKO);
		expect((await anon.request("/invite/nope")).status).toBe(404);
	});

	it("招待リンクを作れるのはオーナーだけ", async () => {
		const { koudenId, invite } = await setup();
		const { client } = await join(HANAKO, await invite());
		const res = await client.request(
			`/k/${koudenId}/invitations`,
			formPost({ role: "editor", expiresInDays: "7" }),
		);
		expect(res.status).toBe(403);
	});

	it("アクセスログでは招待トークンを伏せる", () => {
		expect(maskPath("/invite/abcDEF123")).toBe("/invite/:token");
		expect(maskPath("/k/abc")).toBe("/k/abc");
	});
});

describe("ロール変更・除外・退出", () => {
	it("オーナーはロール変更・除外ができ、除外された人は開けなくなる", async () => {
		const { taro, koudenId, invite } = await setup();
		const { client } = await join(HANAKO, await invite());
		const hanakoId = await userId(HANAKO.email);
		await taro.request(`/k/${koudenId}/members/${hanakoId}/role`, formPost({ role: "viewer" }));
		expect(await role(koudenId, HANAKO.email)).toBe("viewer");
		expect((await client.request(`/k/${koudenId}/reception`)).status).toBe(403);

		await taro.request(`/k/${koudenId}/members/${hanakoId}/remove`, formPost({}));
		expect(await role(koudenId, HANAKO.email)).toBeNull();
		expect((await client.request(`/k/${koudenId}`)).status).toBe(404);
	});

	it("オーナーのロールは変えられず、除外もできない", async () => {
		const { taro, koudenId } = await setup();
		const taroId = await userId(TARO.email);
		await taro.request(`/k/${koudenId}/members/${taroId}/role`, formPost({ role: "viewer" }));
		await taro.request(`/k/${koudenId}/members/${taroId}/remove`, formPost({}));
		expect(await role(koudenId, TARO.email)).toBe("owner");
	});

	it("編集者は他のメンバーを除外できない", async () => {
		const { koudenId, invite } = await setup();
		const path = await invite();
		const { client } = await join(HANAKO, path);
		await join(JIRO, path);
		const res = await client.request(
			`/k/${koudenId}/members/${await userId(JIRO.email)}/remove`,
			formPost({}),
		);
		expect(res.status).toBe(403);
		expect(await role(koudenId, JIRO.email)).toBe("editor");
	});

	it("アーカイブ中はロール変更・除外・譲渡の申し出ができない（退出はできる）", async () => {
		const { taro, koudenId, invite } = await setup();
		const { client } = await join(HANAKO, await invite());
		const hanakoId = await userId(HANAKO.email);
		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }));
		expect(
			(await taro.request(`/k/${koudenId}/members/${hanakoId}/role`, formPost({ role: "viewer" })))
				.status,
		).toBe(403);
		expect(
			(await taro.request(`/k/${koudenId}/members/${hanakoId}/remove`, formPost({}))).status,
		).toBe(403);
		expect(
			(await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }))).status,
		).toBe(403);
		expect(await role(koudenId, HANAKO.email)).toBe("editor");
		expect(await (await taro.request(`/k/${koudenId}/members`)).text()).toContain(
			"アーカイブ中はメンバーを変更できません",
		);
		expect((await client.request(`/k/${koudenId}/leave`, formPost({}))).status).toBe(303);
	});

	it("アーカイブ中は招待リンクの無効化もできない", async () => {
		const { taro, koudenId, invite } = await setup();
		await invite();
		const invitationId =
			(await env.DB.prepare("SELECT id FROM invitations").first<string>("id")) ?? "";
		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }));
		const res = await taro.request(
			`/k/${koudenId}/invitations/${invitationId}/revoke`,
			formPost({}),
		);
		expect(res.status).toBe(403);
		expect(
			await env.DB.prepare("SELECT revoked_at FROM invitations").first("revoked_at"),
		).toBeNull();
		expect(await (await taro.request(`/k/${koudenId}/members`)).text()).not.toContain("無効にする");
	});

	it("メンバーは自分で抜けられる。オーナーは抜けられない", async () => {
		const { taro, koudenId, invite } = await setup();
		const { client } = await join(HANAKO, await invite());
		const left = await client.request(`/k/${koudenId}/leave`, formPost({}));
		expect(left.headers.get("location")).toBe("/?notice=left");
		expect(await role(koudenId, HANAKO.email)).toBeNull();

		const ownerLeave = await taro.request(`/k/${koudenId}/leave`, formPost({}));
		expect(ownerLeave.status).toBe(422);
		expect(await role(koudenId, TARO.email)).toBe("owner");
	});
});

async function withMember() {
	const ctx = await setup();
	const { client: hanako } = await join(HANAKO, await ctx.invite());
	return { ...ctx, hanako, hanakoId: await userId(HANAKO.email) };
}

describe("オーナー譲渡", () => {
	it("承諾すると入れ替わり、旧オーナーは編集者になる", async () => {
		const { taro, hanako, koudenId, hanakoId } = await withMember();
		expect(
			(await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }))).status,
		).toBe(303);
		expect(await (await hanako.request("/")).text()).toContain("オーナーの譲渡を依頼されています");

		const members = await (await hanako.request(`/k/${koudenId}/members`)).text();
		const transferId = /name="transferId" value="([^"]+)"/.exec(members)?.[1] ?? "";
		const res = await hanako.request(`/k/${koudenId}/transfer/accept`, formPost({ transferId }));
		expect(res.headers.get("location")).toBe(`/k/${koudenId}/members?notice=owner`);
		expect(await role(koudenId, HANAKO.email)).toBe("owner");
		expect(await role(koudenId, TARO.email)).toBe("editor");
		const owner = await env.DB.prepare("SELECT owner_user_id FROM koudens WHERE id = ?")
			.bind(koudenId)
			.first("owner_user_id");
		expect(owner).toBe(hanakoId);
		// 旧オーナーはアーカイブできない
		expect((await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }))).status).toBe(
			403,
		);
	});

	it("相手以外は承諾できず、辞退・取り消しができる", async () => {
		const { taro, hanako, koudenId, hanakoId } = await withMember();
		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		const transferId = await env.DB.prepare("SELECT id FROM ownership_transfers").first<string>(
			"id",
		);

		const byOwner = await taro.request(
			`/k/${koudenId}/transfer/accept`,
			formPost({ transferId: transferId ?? "" }),
		);
		expect(byOwner.status).toBe(409);
		expect(await role(koudenId, TARO.email)).toBe("owner");

		await hanako.request(
			`/k/${koudenId}/transfer/decline`,
			formPost({ transferId: transferId ?? "" }),
		);
		expect(await env.DB.prepare("SELECT status FROM ownership_transfers").first("status")).toBe(
			"declined",
		);

		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		const dup = await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		expect(dup.status).toBe(409);
		await taro.request(`/k/${koudenId}/transfer/cancel`, formPost({}));
		const statuses = await env.DB.prepare(
			"SELECT status FROM ownership_transfers ORDER BY created_at",
		).all<{ status: string }>();
		expect(statuses.results.map((r) => r.status)).toEqual(["declined", "cancelled"]);
	});

	it("メンバー以外には譲れず、譲渡先を除外すると譲渡も取り消される", async () => {
		const { taro, koudenId, hanakoId } = await withMember();
		const outsider = await taro.request(
			`/k/${koudenId}/transfer`,
			formPost({ toUserId: "nobody" }),
		);
		expect(outsider.status).toBe(422);
		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		await taro.request(`/k/${koudenId}/members/${hanakoId}/remove`, formPost({}));
		expect(await env.DB.prepare("SELECT status FROM ownership_transfers").first("status")).toBe(
			"cancelled",
		);
	});

	it("別の香典帳の URL からは譲渡を承諾できない", async () => {
		const { taro, hanako, koudenId, hanakoId } = await withMember();
		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		const transferId =
			(await env.DB.prepare("SELECT id FROM ownership_transfers").first<string>("id")) ?? "";
		// 花子がオーナーの別の香典帳
		const other = await hanako.request("/k", formPost({ deceasedName: "別の 故人" }));
		const otherId = other.headers.get("location")?.split("/").pop() ?? "";
		const res = await hanako.request(`/k/${otherId}/transfer/accept`, formPost({ transferId }));
		expect(res.status).toBe(409);
		expect(await role(koudenId, TARO.email)).toBe("owner");
		await hanako.request(`/k/${otherId}/transfer/decline`, formPost({ transferId }));
		expect(await env.DB.prepare("SELECT status FROM ownership_transfers").first("status")).toBe(
			"pending",
		);
	});

	it("期限切れの譲渡は承諾できず、日次の掃除で expired になる", async () => {
		const { taro, hanako, koudenId, hanakoId } = await withMember();
		await taro.request(`/k/${koudenId}/transfer`, formPost({ toUserId: hanakoId }));
		await env.DB.prepare(
			"UPDATE ownership_transfers SET expires_at = '2000-01-01T00:00:00.000Z'",
		).run();
		const transferId = await env.DB.prepare("SELECT id FROM ownership_transfers").first<string>(
			"id",
		);
		const res = await hanako.request(
			`/k/${koudenId}/transfer/accept`,
			formPost({ transferId: transferId ?? "" }),
		);
		expect(res.status).toBe(409);
		const cleaned = await cleanupMembership(env.DB, new Date());
		expect(cleaned.expiredTransfers).toBe(1);
	});
});

describe("部分更新（他の人の変更で取り直す部分）", () => {
	it("トップ・一覧・差出人の部分 HTML はレイアウトなしで返る", async () => {
		const { taro, koudenId } = await setup();
		for (const path of [
			`/k/${koudenId}?partial=overview`,
			`/k/${koudenId}/gifts?partial=results`,
			`/k/${koudenId}/persons?partial=table`,
		]) {
			const html = await (await taro.request(path, { headers: { "hx-request": "true" } })).text();
			expect(html.startsWith("<div id=")).toBe(true);
			expect(html).toContain("data-live=");
			expect(html).not.toContain("<html");
		}
	});
});
