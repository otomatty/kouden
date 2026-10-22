import { env } from "cloudflare:test";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { formPost, HANAKO, JIRO, makeApp, TARO } from "./helpers.ts";

async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
	const eventId = /name="eventId"[^>]*><option value="([^"]+)"/.exec(form)?.[1] ?? "";
	const give = (fields: Record<string, string>, event = eventId) =>
		taro.request(`/k/${koudenId}/gifts`, formPost({ eventId: event, kind: "koden", ...fields }));
	return { taro, koudenId, eventId, give };
}

async function personIdOf(taro: ReturnType<typeof makeApp>, koudenId: string, name: string) {
	const html = await (await taro.request(`/k/${koudenId}/persons`)).text();
	const re = new RegExp(`/k/${koudenId}/persons/([0-9a-f-]{36})"[^>]*>${name}`);
	return re.exec(html)?.[1] ?? "";
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

/** .xlsx（zip）の中の XML を名前 → 文字列で返す */
async function unzipXlsx(res: Response): Promise<Record<string, string>> {
	const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
	return Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strFromU8(v)]));
}

describe("印刷・出力（E7-2, E7-3）", () => {
	it("芳名一覧: 行事ごとに受付番号順で並べ、住所・連名・合計を出す", async () => {
		const { taro, koudenId, give } = await setup();
		await give({
			name: "佐藤 一郎",
			amount: "10000",
			postalCode: "100-0001",
			address: "東京都千代田区千代田1-1",
		});
		await give({ organization: "鈴木商店", amount: "5000" });
		await give({ kind: "kyoka", name: "田中 次郎", itemName: "スタンド花", quantity: "1" });

		const res = await taro.request(`/k/${koudenId}/print/gifts`);
		expect(res.status).toBe(200);
		expect(res.headers.get("cache-control")).toBe("private, no-store");
		const html = await res.text();
		expect(html).toContain("芳名一覧");
		expect(html).toContain("〒100-0001");
		expect(html).toContain("東京都千代田区千代田1-1");
		expect(html).toContain("鈴木商店");
		expect(html).toContain("供花：スタンド花 × 1");
		expect(html).toContain("うち香典 2 件・合計 ¥15,000");
		// 受付番号の順
		expect(html.indexOf("佐藤 一郎")).toBeLessThan(html.indexOf("鈴木商店"));
		// アプリの枠（タブ）は出さない
		expect(html).not.toContain("香典帳のメニュー");
	});

	it("芳名一覧: 行事を指定するとその行事だけを出し、知らない行事は 404", async () => {
		const { taro, koudenId, give } = await setup();
		const settings = await (await taro.request(`/k/${koudenId}/output`)).text();
		const links = [...settings.matchAll(/print\/gifts\?event=([0-9a-f-]{36})/g)];
		expect(links).toHaveLength(0);
		await give({ name: "佐藤 一郎", amount: "10000" });
		const output = await (await taro.request(`/k/${koudenId}/output`)).text();
		const eventId = /print\/gifts\?event=([0-9a-f-]{36})/.exec(output)?.[1] ?? "";
		expect(eventId).not.toBe("");
		const one = await taro.request(`/k/${koudenId}/print/gifts?event=${eventId}`);
		expect(one.status).toBe(200);
		expect(await one.text()).toContain("佐藤 一郎");
		const unknown = await taro.request(
			`/k/${koudenId}/print/gifts?event=00000000-0000-4000-8000-000000000000`,
		);
		expect(unknown.status).toBe(404);
	});

	it("香典返し一覧と宛名一覧: 送付先があればその住所を使い、配送の方だけに絞れる", async () => {
		const { taro, koudenId, give } = await setup();
		await give({
			name: "佐藤 一郎",
			amount: "10000",
			postalCode: "100-0001",
			address: "東京都千代田区千代田1-1",
		});
		await give({ organization: "鈴木商店", amount: "5000", address: "大阪府大阪市北区1-1" });
		await give({ name: "住所 なし", amount: "3000" });

		const satoId = await personIdOf(taro, koudenId, "佐藤 一郎");
		const created = await taro.request(`/k/${koudenId}/persons/${satoId}/return`, formPost({}));
		const returnPath = created.headers.get("location") ?? "";
		expect(returnPath).toMatch(/\/returns\//);
		const saved = await taro.request(
			returnPath,
			formPost({
				version: "1",
				status: "arranged",
				method: "shipping",
				arrangedAt: "2026-11-01",
				shipName: "佐藤 二郎",
				shipPostalCode: "150-0001",
				shipAddress: "東京都渋谷区神宮前1-1",
			}),
		);
		expect(saved.status).toBe(303);

		const returns = await (await taro.request(`/k/${koudenId}/print/returns`)).text();
		expect(returns).toContain("手配済み");
		expect(returns).toContain("未作成");
		expect(returns).toContain("手配 2026/11/01");
		const arranged = await (
			await taro.request(`/k/${koudenId}/print/returns?status=arranged`)
		).text();
		expect(arranged).toContain("佐藤 一郎");
		expect(arranged).not.toContain("鈴木商店");

		const all = await (await taro.request(`/k/${koudenId}/print/addresses`)).text();
		expect(all).toContain("〒150-0001");
		expect(all).toContain("東京都渋谷区神宮前1-1");
		expect(all).toContain("佐藤 二郎 様");
		expect(all).not.toContain("東京都千代田区千代田1-1");
		expect(all).toContain("鈴木商店 御中");
		expect(all).toContain("住所が入っていない差出人が 1 人います");

		const shipping = await (
			await taro.request(`/k/${koudenId}/print/addresses?only=shipping`)
		).text();
		expect(shipping).toContain("佐藤 二郎 様");
		expect(shipping).not.toContain("鈴木商店");
	});

	it("宛名一覧: いただきものを削除した差出人も「すべての差出人」に出す", async () => {
		const { taro, koudenId, give } = await setup();
		await give({ name: "佐藤 一郎", amount: "10000", address: "東京都千代田区千代田1-1" });
		const gifts = await (await taro.request(`/k/${koudenId}/gifts`)).text();
		const giftId = new RegExp(`/k/${koudenId}/gifts/([0-9a-f-]{36})`).exec(gifts)?.[1] ?? "";
		const deleted = await taro.request(
			`/k/${koudenId}/gifts/${giftId}/delete`,
			formPost({ version: "1" }),
		);
		expect(deleted.status).toBe(303);
		const all = await (await taro.request(`/k/${koudenId}/print/addresses`)).text();
		expect(all).toContain("佐藤 一郎 様");
		expect(all).toContain("東京都千代田区千代田1-1");
	});

	it("Excel: 3 枚のシートに書き出し、文字列は数式にしない", async () => {
		const { taro, koudenId, give } = await setup();
		await give({ name: "佐藤 一郎", nameKana: "さとう いちろう", amount: "10000" });
		await give({ name: '=HYPERLINK("http://evil.example","x")', amount: "5000" });
		await give({ organization: "A&B<商店>", amount: "3000" });

		const res = await taro.request(`/k/${koudenId}/export.xlsx`);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(res.headers.get("cache-control")).toBe("private, no-store");
		const disposition = res.headers.get("content-disposition") ?? "";
		expect(disposition).toContain("attachment;");
		expect(decodeURIComponent(disposition.split("UTF-8''")[1] ?? "")).toMatch(
			/^故 山田 一郎 様_\d{8}\.xlsx$/,
		);

		const files = await unzipXlsx(res);
		const workbook = files["xl/workbook.xml"] ?? "";
		expect(workbook).toContain('name="いただきもの"');
		expect(workbook).toContain('name="差出人"');
		expect(workbook).toContain('name="香典返し"');
		const all = Object.values(files).join("");
		expect(all).toContain("さとう いちろう");
		expect(all).toContain('<t>=HYPERLINK("http://evil.example","x")</t>');
		// XML として壊れないように書く
		expect(all).toContain("<t>A&amp;B&lt;商店&gt;</t>");
		const sheets = Object.entries(files).filter(([k]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k));
		expect(sheets.length).toBe(3);
		for (const [, xml] of sheets) expect(xml).not.toContain("<f>");
	});

	it("閲覧者も出力でき、メンバー以外には存在を隠す", async () => {
		const { koudenId, give } = await setup();
		await give({ name: "佐藤 一郎", amount: "10000" });
		const hanako = makeApp(HANAKO);
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "viewer");
		expect((await hanako.request(`/k/${koudenId}/output`)).status).toBe(200);
		expect((await hanako.request(`/k/${koudenId}/print/gifts`)).status).toBe(200);
		expect((await hanako.request(`/k/${koudenId}/export.xlsx`)).status).toBe(200);

		const jiro = makeApp(JIRO);
		await jiro.login();
		for (const path of [
			"/output",
			"/print/gifts",
			"/print/returns",
			"/print/addresses",
			"/export.xlsx",
		]) {
			expect((await jiro.request(`/k/${koudenId}${path}`)).status).toBe(404);
		}
	});
});
