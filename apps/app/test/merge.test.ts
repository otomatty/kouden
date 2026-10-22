import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

/** ログインして香典帳を 1 冊作り、香典を登録する関数を返す */
async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
	const eventId = /name="eventId"(?:[^>]*><option)? value="([^"]+)"/.exec(form)?.[1] ?? "";
	/** 香典を登録して、差出人の ID を返す */
	const give = async (fields: Record<string, string>) => {
		const res = await taro.request(
			`/k/${koudenId}/gifts`,
			formPost({ eventId, kind: "koden", ...fields }),
		);
		const giftId = new URL(res.headers.get("location") ?? "", "http://x").searchParams.get(
			"created",
		);
		const gift = await (await taro.request(`/k/${koudenId}/gifts/${giftId}`)).text();
		return /\/persons\/([0-9a-f-]{36})/.exec(gift)?.[1] ?? "";
	};
	return { taro, koudenId, give };
}

describe("差出人の統合（E5-2）", () => {
	it("一覧に候補の組の数を出し、候補だけの一覧に「まとめる」を出す", async () => {
		const { taro, koudenId, give } = await setup();
		const a = await give({ name: "佐藤 一郎", amount: "10000" });
		const b = await give({ name: "佐藤一郎", amount: "5000" });
		await give({ name: "鈴木 花子", amount: "3000" });

		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		expect(list).toContain("名前・ふりがなが同じ差出人が 1 組あります");
		expect(list).toContain(`href="/k/${koudenId}/persons?duplicates=1"`);
		expect(list).not.toContain("を残してまとめる");

		const dup = await (await taro.request(`/k/${koudenId}/persons?duplicates=1`)).text();
		expect(dup).toContain("2 人");
		expect(dup).not.toContain("鈴木 花子");
		expect(dup).toContain(`href="/k/${koudenId}/persons/${a}/merge"`);
		expect(dup).toContain(`href="/k/${koudenId}/persons/${b}/merge"`);
		// 他の人の変更で取り直すときも、候補だけの一覧のまま
		expect(dup).toContain("partial=table&amp;duplicates=1");
	});

	it("差出人の画面に候補を出し、確かめる画面を経てまとめる", async () => {
		const { taro, koudenId, give } = await setup();
		const a = await give({ name: "佐藤 一郎", amount: "10000", address: "東京都千代田区1-1" });
		const b = await give({ name: "佐藤一郎", nameKana: "さとう いちろう", amount: "5000" });

		const page = await (await taro.request(`/k/${koudenId}/persons/${a}`)).text();
		expect(page).toContain("同じ人かもしれない差出人");
		expect(page).toContain(`href="/k/${koudenId}/persons/${a}/merge?from=${b}"`);

		const choose = await (await taro.request(`/k/${koudenId}/persons/${a}/merge`)).text();
		expect(choose).toContain(`href="/k/${koudenId}/persons/${a}/merge?from=${b}"`);
		// 検索でほかの差出人も選べる（残す差出人は出さない）
		const search = await (
			await taro.request(`/k/${koudenId}/persons/${a}/merge?q=${encodeURIComponent("佐藤")}`)
		).text();
		expect(search.match(/を選ぶ"/g)).toHaveLength(2);

		const confirm = await (
			await taro.request(`/k/${koudenId}/persons/${a}/merge?from=${b}`)
		).text();
		expect(confirm).toContain("まとめた後");
		// 空いている欄は相手の内容で埋まる
		expect(confirm).toMatch(
			/ふりがな<\/th><td[^>]*><\/td><td[^>]*>さとう いちろう<\/td><td[^>]*>さとう いちろう</,
		);
		expect(confirm).toContain('name="intoVersion" value="1"');
		expect(confirm).toContain(`name="fromId" value="${b}"`);
		expect(confirm).toContain(`href="/k/${koudenId}/persons/${b}/merge?from=${a}"`);

		const merged = await taro.request(
			`/k/${koudenId}/persons/${a}/merge`,
			formPost({ intoVersion: "1", fromId: b, fromVersion: "1" }),
		);
		expect(merged.status).toBe(303);
		expect(merged.headers.get("location")).toBe(`/k/${koudenId}/persons/${a}?notice=merged`);
		const after = await (await taro.request(`/k/${koudenId}/persons/${a}?notice=merged`)).text();
		expect(after).toContain("差出人をまとめました。");
		expect(after).toContain("香典の合計 ¥15,000");
		expect(after).toMatch(/name="nameKana"[^>]*value="さとう いちろう"/);
		expect(after).not.toContain("同じ人かもしれない差出人");
		// 履歴に、まとめた差出人と、埋めた欄が出る
		expect(after).toContain("統合");
		expect(after).toMatch(/まとめた差出人:\s*佐藤一郎/);
		expect(after).toMatch(/ふりがな:\s*（なし） →\s*さとう いちろう/);
		expect((await taro.request(`/k/${koudenId}/persons/${b}`)).status).toBe(404);
		const list = await (await taro.request(`/k/${koudenId}/persons`)).text();
		expect(list).toContain("1 人");
		expect(list).not.toContain("名前・ふりがなが同じ差出人が");
	});

	it("開いた後に変わっていたら、最新の内容でもう一度確かめてもらう", async () => {
		const { taro, koudenId, give } = await setup();
		const a = await give({ name: "A", amount: "10000" });
		const b = await give({ name: "B", amount: "5000" });
		await taro.request(`/k/${koudenId}/persons/${b}`, formPost({ version: "1", name: "B 改" }));
		const res = await taro.request(
			`/k/${koudenId}/persons/${a}/merge`,
			formPost({ intoVersion: "1", fromId: b, fromVersion: "1" }),
		);
		expect(res.status).toBe(409);
		const html = await res.text();
		expect(html).toContain("開いている間に他の人が差出人を更新しました");
		expect(html).toContain("B 改");
		expect(html).toContain('name="fromVersion" value="2"');
	});

	it("2 人とも香典返しがあれば、まとめるボタンを出さず、送っても変えない", async () => {
		const { taro, koudenId, give } = await setup();
		const a = await give({ name: "A", amount: "10000" });
		const b = await give({ name: "B", amount: "5000" });
		for (const personId of [a, b]) {
			const res = await taro.request(`/k/${koudenId}/persons/${personId}/return`, formPost({}));
			expect(res.status).toBe(303);
		}
		const confirm = await (
			await taro.request(`/k/${koudenId}/persons/${a}/merge?from=${b}`)
		).text();
		expect(confirm).toContain("2 人とも香典返しの記録があるため、まとめられません");
		expect(confirm).not.toContain('name="fromId"');
		const res = await taro.request(
			`/k/${koudenId}/persons/${a}/merge`,
			formPost({ intoVersion: "1", fromId: b, fromVersion: "1" }),
		);
		expect(res.status).toBe(422);
		expect((await taro.request(`/k/${koudenId}/persons/${b}`)).status).toBe(200);
	});

	it("閲覧者は開けず、まとめられない。候補も出さない", async () => {
		const { taro, koudenId, give } = await setup();
		const a = await give({ name: "佐藤 一郎", amount: "10000" });
		const b = await give({ name: "佐藤一郎", amount: "5000" });
		const hanako = makeApp(HANAKO);
		await hanako.login();
		const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
			.bind(HANAKO.email)
			.first<{ id: string }>();
		await env.DB.prepare(
			"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, 'viewer', '')",
		)
			.bind(koudenId, user?.id)
			.run();
		expect((await hanako.request(`/k/${koudenId}/persons/${a}/merge?from=${b}`)).status).toBe(403);
		const res = await hanako.request(
			`/k/${koudenId}/persons/${a}/merge`,
			formPost({ intoVersion: "1", fromId: b, fromVersion: "1" }),
		);
		expect(res.status).toBe(403);
		expect(await (await hanako.request(`/k/${koudenId}/persons/${a}`)).text()).not.toContain(
			"同じ人かもしれない差出人",
		);
		expect(await (await hanako.request(`/k/${koudenId}/persons`)).text()).not.toContain(
			"名前・ふりがなが同じ差出人が",
		);
		expect((await taro.request(`/k/${koudenId}/persons/${b}`)).status).toBe(200);
	});
});
