import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.tsx";
import { koudenSubpath } from "../src/routes/legacy.tsx";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

const app = createApp();
const location = (res: Response) => res.headers.get("location");

/** TARO の香典帳を作り、旧 ID を付ける */
async function legacyKouden() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	const koudenId = location(created)?.split("/").pop() ?? "";
	const legacyId = crypto.randomUUID();
	await env.DB.prepare("UPDATE koudens SET legacy_kouden_id = ? WHERE id = ?")
		.bind(legacyId, koudenId)
		.run();
	return { taro, koudenId, legacyId };
}

describe("旧アプリの URL", () => {
	it.each([
		["/auth/login", "/login"],
		["/auth/login?redirectTo=%2Fkoudens%2Fabc", "/login?return_to=%2Fkoudens%2Fabc"],
		["/auth/login?redirectTo=https%3A%2F%2Fevil.example", "/login"],
		["/auth/callback?code=x", "/login"],
		["/koudens", "/"],
		["/koudens?tab=archived", "/?tab=archived"],
		["/profile", "/account"],
		["/settings", "/account"],
		["/legal", "/legal/tokushoho"],
		["/features", "/"],
		["/features/export", "/"],
		["/manuals/basic/start", "/"],
	])("%s → %s", async (from, to) => {
		const res = await app.request(from, {}, env);
		expect(res.status).toBe(302);
		expect(location(res)).toBe(to);
	});

	it("旧招待リンクは作り直しを案内する", async () => {
		const res = await app.request("/invitations/old-token", {}, env);
		expect(res.status).toBe(410);
		expect(await res.text()).toContain("招待リンクを作り直して");
	});

	it("未ログインならログイン後に同じ旧 URL へ戻す", async () => {
		const res = await app.request("/koudens/abc/entries?x=1", {}, env);
		expect(location(res)).toBe("/login?return_to=%2Fkoudens%2Fabc%2Fentries%3Fx%3D1");
	});

	it("/koudens/new はログイン後の新規作成へ", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		expect(location(await taro.request("/koudens/new"))).toBe("/k/new");
	});

	it("旧 ID を新 ID に置き換え、対応する画面へクエリを保って転送する", async () => {
		const { taro, koudenId, legacyId } = await legacyKouden();
		const cases = [
			[`/koudens/${legacyId}`, `/k/${koudenId}`],
			[
				`/koudens/${legacyId}/entries?q=%E5%B1%B1%E7%94%B0`,
				`/k/${koudenId}/gifts?q=%E5%B1%B1%E7%94%B0`,
			],
			[`/koudens/${legacyId}/telegrams`, `/k/${koudenId}/gifts?kind=choden`],
			[`/koudens/${legacyId}/settings/members`, `/k/${koudenId}/members`],
			[`/koudens/${legacyId}/statistics`, `/k/${koudenId}`],
			[`/purchase/${legacyId}`, `/k/${koudenId}/settings`],
		];
		for (const [from, to] of cases) {
			const res = await taro.request(from as string);
			expect(res.status, from).toBe(302);
			expect(location(res), from).toBe(to);
		}
		// 転送先が実際に開ける
		expect((await taro.request(`/k/${koudenId}/gifts`)).status).toBe(200);
	});

	it("見つからない・メンバーでない旧 ID は一覧へ案内する", async () => {
		const { legacyId } = await legacyKouden();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		for (const path of [`/koudens/${legacyId}/entries`, "/koudens/no-such-id"]) {
			const res = await hanako.request(path);
			expect(location(res)).toBe("/?notice=legacy_missing");
		}
		const list = await (await hanako.request("/?notice=legacy_missing")).text();
		expect(list).toContain("以前のアドレスの香典帳が見つからない");
	});
});

describe("koudenSubpath", () => {
	it.each([
		["", ""],
		["entries", "/gifts"],
		["offerings", "/gifts"],
		["members", "/members"],
		["return_records", "/returns"],
		["return_records/items/abc", "/returns/settings"],
		["settings", "/settings"],
		["settings/general", "/settings"],
		["settings/return-items", "/returns/settings"],
		["archived", ""],
	])("%s → %s", (rest, expected) => {
		expect(koudenSubpath(rest)).toBe(expected);
	});
});
