import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ledgerFor } from "../src/ledger/client.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

/** ログインして香典帳を 1 冊作り、その ID と、受付で使う行事の ID を返す */
async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	expect(created.status).toBe(303);
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const reception = await (await taro.request(`/k/${koudenId}/reception`)).text();
	const eventId = /name="eventId" value="([^"]+)"/.exec(reception)?.[1] ?? "";
	expect(eventId).not.toBe("");
	return { taro, koudenId, eventId };
}

async function addMember(koudenId: string, email: string, role: "editor" | "viewer") {
	const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
		.bind(email)
		.first<{ id: string }>();
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, ?, '')",
	)
		.bind(koudenId, user?.id, role)
		.run();
}

describe("香典帳の作成と一覧", () => {
	it("作成すると一覧に表示され、既定の行事が用意される", async () => {
		const { taro, koudenId } = await setup();
		const list = await (await taro.request("/")).text();
		expect(list).toContain("故 山田 一郎 様");
		expect(list).toContain(`/k/${koudenId}`);
		const settings = await (await taro.request(`/k/${koudenId}/settings`)).text();
		expect(settings).toContain('value="通夜"');
		expect(settings).toContain('value="告別式"');
		expect(settings).toContain('value="会社関係"');
	});

	it("故人名がなければ作成できない", async () => {
		const taro = makeApp(TARO);
		await taro.login();
		const res = await taro.request("/k", formPost({ deceasedName: " " }));
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("故人のお名前を入力してください");
	});

	it("未ログインならログイン画面へ", async () => {
		const anon = makeApp(TARO);
		const res = await anon.request("/k/new");
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("/login?return_to=%2Fk%2Fnew");
	});

	it("メンバーでない人には存在を隠す（404）", async () => {
		const { koudenId } = await setup();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		expect((await hanako.request(`/k/${koudenId}`)).status).toBe(404);
		expect((await hanako.request(`/k/${koudenId}/gifts`)).status).toBe(404);
	});
});

describe("受付", () => {
	it("htmx で登録すると受付番号入りの部分 HTML が返り、続けて入力できる", async () => {
		const { taro, koudenId, eventId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost(
				{ eventId, kind: "koden", name: "鈴木 次郎", amount: "１０，０００" },
				{ htmx: true },
			),
		);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html.startsWith('<div id="reception-panel"')).toBe(true);
		expect(html).toContain("鈴木 次郎 様");
		expect(html).toMatch(/text-7xl[^>]*>1</);
		expect(html).toContain("¥10,000");

		const second = await (
			await taro.request(
				`/k/${koudenId}/reception`,
				formPost({ eventId, kind: "koden", name: "田中 三郎", amount: "5000" }, { htmx: true }),
			)
		).text();
		expect(second).toMatch(/text-7xl[^>]*>2</);
	});

	it("JavaScript なしでも登録でき、登録結果の画面に移る", async () => {
		const { taro, koudenId, eventId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "kyoka", organization: "ABC 商事", itemName: "生花" }),
		);
		expect(res.status).toBe(303);
		const page = await (await taro.request(res.headers.get("location") ?? "")).text();
		expect(page).toContain("ABC 商事 様");
		expect(page).toContain("供花");
	});

	it("入力エラーは 422 でフォームに表示する", async () => {
		const { taro, koudenId, eventId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "山田" }, { htmx: true }),
		);
		expect(res.status).toBe(422);
		const html = await res.text();
		expect(html).toContain("香典の金額を入力してください");
		expect(html).toContain('value="山田"');
	});

	it("同じ人の候補を出し、選ぶと同じ差出人にまとまる", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "佐藤 一郎", amount: "5000" }),
		);
		const candidates = await (
			await taro.request(`/k/${koudenId}/persons/candidates?name=${encodeURIComponent("佐藤")}`)
		).text();
		const personId = /name="personId" value="([^"]+)"/g;
		const ids = [...candidates.matchAll(personId)].map((m) => m[1]).filter(Boolean);
		expect(ids).toHaveLength(1);

		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "kyoka", personId: ids[0] ?? "" }),
		);
		const persons = await (await taro.request(`/k/${koudenId}/persons`)).text();
		expect(persons).toContain("1 人");
	});

	it("既存の差出人を選んだまま入力エラーになっても、選択が残る", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "山田 太郎", amount: "5000" }),
		);
		const candidates = await (
			await taro.request(`/k/${koudenId}/persons/candidates?name=${encodeURIComponent("山田")}`)
		).text();
		const personId = /name="personId" value="([^"]+)"/.exec(candidates)?.[1] ?? "";
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", personId, name: "", amount: "五千" }, { htmx: true }),
		);
		expect(res.status).toBe(422);
		const html = await res.text();
		expect(html).toMatch(new RegExp(`name="personId" value="${personId}" checked`));
		expect(html).toContain("山田 太郎");
	});

	it("閲覧者は受付画面を開けず、登録もできない", async () => {
		const { koudenId, eventId } = await setup();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "viewer");
		expect((await hanako.request(`/k/${koudenId}`)).status).toBe(200);
		expect((await hanako.request(`/k/${koudenId}/reception`)).status).toBe(403);
		const res = await hanako.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "x", amount: "1" }),
		);
		expect(res.status).toBe(403);
	});

	it("Origin のない POST は CSRF 対策で拒否する", async () => {
		const { taro, koudenId, eventId } = await setup();
		const res = await taro.app.request(
			`/k/${koudenId}/reception`,
			{
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					origin: "https://evil.example",
				},
				body: new URLSearchParams({ eventId, kind: "koden", name: "x", amount: "1" }).toString(),
			},
			env,
		);
		expect(res.status).toBe(403);
	});
});

async function withGift() {
	const ctx = await setup();
	const res = await ctx.taro.request(
		`/k/${ctx.koudenId}/reception`,
		formPost({ eventId: ctx.eventId, kind: "koden", name: "高橋 四郎", amount: "3000" }),
	);
	const giftId =
		new URL(res.headers.get("location") ?? "", "http://x").searchParams.get("done") ?? "";
	return { ...ctx, giftId };
}

describe("いただきもの・差出人の編集", () => {
	it("変更履歴には登録時の内容も出る", async () => {
		const { taro, koudenId, giftId } = await withGift();
		const page = await (await taro.request(`/k/${koudenId}/gifts/${giftId}`)).text();
		expect(page).toContain("変更履歴（1 件）");
		expect(page).toContain("金額: ¥3,000");
		expect(page).toContain("種別: 香典");
	});

	it("一覧の絞り込み・検索", async () => {
		const { taro, koudenId, eventId } = await withGift();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "伊藤 五郎", amount: "10000" }),
		);
		const all = await (await taro.request(`/k/${koudenId}/gifts`)).text();
		expect(all).toContain("2 件・香典 ¥13,000");
		const searched = await (
			await taro.request(`/k/${koudenId}/gifts?q=${encodeURIComponent("伊藤")}`)
		).text();
		expect(searched).toContain("1 件・香典 ¥10,000");
		const ranged = await (await taro.request(`/k/${koudenId}/gifts?min=5000`)).text();
		expect(ranged).toContain("伊藤 五郎");
		expect(ranged).not.toContain("高橋 四郎");
	});

	it("編集すると保存され、古い version での保存は競合として最新を表示する", async () => {
		const { taro, koudenId, eventId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		const saved = await taro.request(
			path,
			formPost({ version: "1", eventId, kind: "koden", amount: "5000" }),
		);
		expect(saved.status).toBe(303);
		const conflict = await taro.request(
			path,
			formPost({ version: "1", eventId, kind: "koden", amount: "7000" }),
		);
		expect(conflict.status).toBe(409);
		const html = await conflict.text();
		// 自分の入力と最新の内容の違いを示し、フォームには自分の入力と最新の version を入れる（E8-3）
		expect(html).toContain("他の人がこの記録を更新しました");
		expect(html).toMatch(/<td[^>]*>7000<\/td><td[^>]*>5000<\/td>/);
		expect(html).toContain('name="amount" type="text" value="7000"');
		expect(html).toContain('name="version" value="2"');
		// そのまま保存すれば上書きになる
		const overwrite = await taro.request(
			path,
			formPost({ version: "2", eventId, kind: "koden", amount: "7000" }),
		);
		expect(overwrite.status).toBe(303);
		const page = await (await taro.request(path)).text();
		expect(page).toContain('value="7000"');
		expect(page).toContain("金額: ¥5,000 → ¥7,000");
	});

	it("連名の差出人を追加し、外せる", async () => {
		const { taro, koudenId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		expect(
			(await taro.request(`${path}/contributors`, formPost({ version: "1", name: "高橋 花子" })))
				.status,
		).toBe(303);
		const page = await (await taro.request(path)).text();
		expect(page).toContain("高橋 花子");
		const personId = /contributors\/([^/"]+)\/delete/.exec(page)?.[1];
		expect(personId).toBeTruthy();
		const removed = await taro.request(
			`${path}/contributors/${personId}/delete`,
			formPost({ version: "2" }),
		);
		expect(removed.status).toBe(303);
	});

	it("連名の操作が競合したら、入力を残して最新の内容を表示する", async () => {
		const { taro, koudenId, eventId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		// 他の人が先に更新（version 1 → 2）
		await taro.request(path, formPost({ version: "1", eventId, kind: "koden", amount: "5000" }));

		const add = await taro.request(
			`${path}/contributors`,
			formPost({ version: "1", name: "高橋 花子", shareAmount: "1000" }),
		);
		expect(add.status).toBe(409);
		const addHtml = await add.text();
		expect(addHtml).toContain("入力は残してある");
		expect(addHtml).toMatch(/id="add-name"[^>]*value="高橋 花子"/);

		const page = await (await taro.request(path)).text();
		const personId = /contributors\/([0-9a-f-]{36})"/.exec(page)?.[1] ?? "";
		const share = await taro.request(
			`${path}/contributors/${personId}`,
			formPost({ version: "1", shareAmount: "4000" }),
		);
		expect(share.status).toBe(409);
		expect(await share.text()).toMatch(new RegExp(`id="share-${personId}"[^>]*value="4000"`));
	});

	it("「代表者にする」も競合後の画面に残す", async () => {
		const { taro, koudenId, eventId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		await taro.request(`${path}/contributors`, formPost({ version: "1", name: "高橋 花子" }));
		const page = await (await taro.request(path)).text();
		const second =
			[...page.matchAll(/contributors\/([0-9a-f-]{36})"/g)].map((m) => m[1]).at(-1) ?? "";
		// 他の人が先に更新（version 2 → 3）
		await taro.request(path, formPost({ version: "2", eventId, kind: "koden", amount: "5000" }));
		const res = await taro.request(
			`${path}/contributors/${second}`,
			formPost({ version: "2", shareAmount: "", makePrimary: "1" }),
		);
		expect(res.status).toBe(409);
		const html = await res.text();
		const form = html.slice(html.indexOf(`contributors/${second}"`));
		expect(form.slice(0, form.indexOf("</form>"))).toMatch(/name="makePrimary"[^>]*checked/);
	});

	it("負担額・代表者の変更は、変更前後を履歴に残す", async () => {
		const { taro, koudenId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		const page = await (await taro.request(path)).text();
		const personId = /contributors\/([0-9a-f-]{36})"/.exec(page)?.[1] ?? "";
		await taro.request(
			`${path}/contributors/${personId}`,
			formPost({ version: "1", shareAmount: "2000" }),
		);
		await taro.request(
			`${path}/contributors/${personId}`,
			formPost({ version: "2", shareAmount: "3000" }),
		);
		const after = await (await taro.request(path)).text();
		expect(after).toContain("負担額 ¥2,000・代表者 → 負担額 ¥3,000・代表者");
	});

	it("代表者を替えると、外れた人の変更も同じ履歴に残す", async () => {
		const { taro, koudenId, giftId } = await withGift();
		const path = `/k/${koudenId}/gifts/${giftId}`;
		await taro.request(`${path}/contributors`, formPost({ version: "1", name: "高橋 花子" }));
		const page = await (await taro.request(path)).text();
		const ids = [...page.matchAll(/contributors\/([0-9a-f-]{36})"/g)].map((m) => m[1]);
		const hanakoId = ids.find((id) => id !== ids[0]) ?? "";
		await taro.request(
			`${path}/contributors/${hanakoId}`,
			formPost({ version: "2", shareAmount: "", makePrimary: "1" }),
		);
		const after = await (await taro.request(path)).text();
		expect(after).toContain("負担額なし → 負担額なし・代表者");
		expect(after).toContain("負担額なし・代表者 → 負担額なし");
	});

	it("削除すると一覧から消える", async () => {
		const { taro, koudenId, giftId } = await withGift();
		const res = await taro.request(
			`/k/${koudenId}/gifts/${giftId}/delete`,
			formPost({ version: "1" }),
		);
		expect(res.headers.get("location")).toBe(`/k/${koudenId}/gifts?notice=deleted`);
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain(
			"まだ登録がありません",
		);
	});

	it("差出人一覧の行で編集し、「保存して次へ」で次の行が編集状態で返る", async () => {
		const { taro, koudenId, eventId } = await withGift();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "渡辺 六郎", amount: "1000" }),
		);
		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const ids = [...list.matchAll(/id="person-([0-9a-f-]{36})"/g)].map((m) => m[1] ?? "");
		expect(ids).toHaveLength(2);
		const [first, second] = ids;

		const editRow = await (
			await taro.request(`/k/${koudenId}/persons/${first}/row?edit=1`, {
				headers: { "hx-request": "true" },
			})
		).text();
		expect(editRow).toContain("保存して次へ");
		const name = /name="name"[^>]*value="([^"]*)"/.exec(editRow)?.[1] ?? "";

		const res = await taro.request(
			`/k/${koudenId}/persons/${first}`,
			formPost(
				{ version: "1", mode: "row", go: "next", name, address: "東京都千代田区1-1" },
				{ htmx: true },
			),
		);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("東京都千代田区1-1");
		expect(html).toMatch(new RegExp(`id="person-${second}"[^>]*hx-swap-oob="outerHTML"`));
		expect(html).toContain(`action="/k/${koudenId}/persons/${second}"`);
	});

	it("検索中の行で、検索に一致しない名前に変えても保存できる", async () => {
		const { taro, koudenId, eventId } = await withGift();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "高橋 次郎", amount: "1000" }),
		);
		const q = encodeURIComponent("高橋");
		const list = await (await taro.request(`/k/${koudenId}/persons?q=${q}`)).text();
		const ids = [...list.matchAll(/id="person-([0-9a-f-]{36})"/g)].map((m) => m[1] ?? "");
		expect(ids).toHaveLength(2);
		const res = await taro.request(
			`/k/${koudenId}/persons/${ids[0]}`,
			formPost(
				{ version: "1", mode: "row", go: "next", q: "高橋", name: "佐藤 一郎" },
				{ htmx: true },
			),
		);
		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("佐藤 一郎");
		expect(html).toMatch(new RegExp(`id="person-${ids[1]}"[^>]*hx-swap-oob="outerHTML"`));
	});

	it("差出人の保存が競合したら、違いを示して上書きできる（行内・詳細）", async () => {
		const { taro, koudenId } = await withGift();
		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const id = /id="person-([0-9a-f-]{36})"/.exec(list)?.[1] ?? "";
		const path = `/k/${koudenId}/persons/${id}`;
		expect(
			(await taro.request(path, formPost({ version: "1", name: "高橋 四郎", address: "東京都" })))
				.status,
		).toBe(303);

		const row = await taro.request(
			path,
			formPost({ version: "1", mode: "row", name: "高橋 四郎", address: "大阪府" }, { htmx: true }),
		);
		expect(row.status).toBe(409);
		const rowHtml = await row.text();
		expect(rowHtml.startsWith(`<tr id="person-${id}"`)).toBe(true);
		expect(rowHtml).toMatch(/<td[^>]*>大阪府<\/td><td[^>]*>東京都<\/td>/);
		expect(rowHtml).toContain('name="version" value="2"');

		const page = await taro.request(
			path,
			formPost({ version: "1", name: "高橋 四郎", address: "大阪府" }),
		);
		expect(page.status).toBe(409);
		expect(await page.text()).toContain("他の人がこの記録を更新しました");

		const detail = await (await taro.request(path)).text();
		expect(detail).toContain("住所: （なし） → 東京都");
	});

	it("差出人の入力エラーは行の中に表示する", async () => {
		const { taro, koudenId } = await withGift();
		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const id = /id="person-([0-9a-f-]{36})"/.exec(list)?.[1];
		const res = await taro.request(
			`/k/${koudenId}/persons/${id}`,
			formPost(
				{ version: "1", mode: "row", name: "", organization: "", postalCode: "123" },
				{ htmx: true },
			),
		);
		expect(res.status).toBe(422);
		const html = await res.text();
		expect(html.startsWith(`<tr id="person-${id}"`)).toBe(true);
		expect(html).toContain("氏名か団体名のどちらかを入力してください");
		expect(html).toContain("7 桁");
	});
});

describe("設定・アーカイブ・削除", () => {
	it("行事の追加・関係の追加ができ、使用中の関係は削除できない", async () => {
		const { taro, koudenId, eventId } = await setup();
		const added = await taro.request(
			`/k/${koudenId}/events`,
			formPost({ kind: "memorial_49", name: "", date: "2026-11-20" }),
		);
		expect(added.status).toBe(303);
		const settings = await (await taro.request(`/k/${koudenId}/settings`)).text();
		expect(settings).toContain('value="四十九日"');

		const relId = /relationships\/([^/"]+)\/delete/.exec(settings)?.[1] ?? "";
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "a", amount: "1", relationshipId: relId }),
		);
		const res = await taro.request(`/k/${koudenId}/relationships/${relId}/delete`, formPost({}));
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("使用中の関係は削除できません");
	});

	it("設定の行事・関係は部分 HTML で取り直せる", async () => {
		const { taro, koudenId } = await setup();
		for (const [partial, id] of [
			["events", "settings-events"],
			["relationships", "settings-relationships"],
		]) {
			const html = await (
				await taro.request(`/k/${koudenId}/settings?partial=${partial}`, {
					headers: { "hx-request": "true" },
				})
			).text();
			expect(html.startsWith(`<div id="${id}"`)).toBe(true);
			expect(html).not.toContain("<html");
		}
	});

	it("アーカイブすると閲覧のみになり、一覧のアーカイブに移る", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }));
		expect(await (await taro.request("/")).text()).not.toContain(`/k/${koudenId}"`);
		expect(await (await taro.request("/?tab=archived")).text()).toContain(`/k/${koudenId}`);
		expect(await (await taro.request(`/k/${koudenId}`)).text()).toContain(
			"アーカイブされているため",
		);
		const res = await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "x", amount: "1" }),
		);
		expect(res.status).toBe(403);
		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "0" }));
		expect((await taro.request(`/k/${koudenId}/reception`)).status).toBe(200);
	});

	it("編集者はアーカイブ・削除できない", async () => {
		const { koudenId } = await setup();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "editor");
		expect(
			(await hanako.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }))).status,
		).toBe(403);
		expect(
			(await hanako.request(`/k/${koudenId}/delete`, formPost({ confirm: "故 山田 一郎 様" })))
				.status,
		).toBe(403);
	});

	it("名前を入力して削除すると、D1 と DO の中身が消える", async () => {
		const { taro, koudenId, eventId } = await setup();
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "a", amount: "1" }),
		);
		const wrong = await taro.request(`/k/${koudenId}/delete`, formPost({ confirm: "違う名前" }));
		expect(wrong.status).toBe(422);
		const res = await taro.request(
			`/k/${koudenId}/delete`,
			formPost({ confirm: "故 山田 一郎 様" }),
		);
		expect(res.headers.get("location")).toBe("/?notice=deleted");
		expect(await env.DB.prepare("SELECT count(*) AS n FROM koudens").first("n")).toBe(0);
		expect(await env.DB.prepare("SELECT count(*) AS n FROM kouden_members").first("n")).toBe(0);
		expect((await taro.request(`/k/${koudenId}`)).status).toBe(404);
		// DO の中身も消えていて、作り直されない
		const ledger = ledgerFor(env, koudenId);
		const gifts = await ledger.listGifts(
			{ koudenId, userId: "u", displayName: "u", role: "owner", plan: "free" },
			{},
		);
		expect(gifts).toEqual({ ok: false, error: { code: "not_found" } });
	});
});
