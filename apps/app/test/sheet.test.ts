import { FREE_GIFT_LIMIT } from "@kouden/domain";
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

/** ログインして香典帳を 1 冊作り、その ID と行事（既定の「葬儀」）の ID を返す */
async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
	const eventId = /name="eventId"(?:[^>]*><option)? value="([^"]+)"/.exec(form)?.[1] ?? "";
	expect(eventId).not.toBe("");
	const save = (rows: Record<string, unknown>[], client = taro) =>
		client.request(`/k/${koudenId}/gifts/sheet`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ eventId, rows }),
		});
	return { taro, koudenId, eventId, save };
}

type RowResult = {
	key: string;
	status: string;
	giftId?: string;
	giftVersion?: number;
	personId?: string;
	personVersion?: number;
	receiptNo?: number | null;
	values?: Record<string, string>;
	errors?: Record<string, string>;
	message?: string;
};
const rowsOf = async (res: Response) => ((await res.json()) as { rows: RowResult[] }).rows;

describe("表で入力（08 案 C）", () => {
	it("行ごとに登録し、番号を表の順に振る。空の行は飛ばし、入力エラーの行だけ返す", async () => {
		const { save } = await setup();
		const res = await save([
			{
				key: "a",
				name: "佐藤 一郎",
				amount: "1万",
				postalCode: "1000001",
				address: "東京都千代田区千代田1-1",
			},
			{ key: "b" },
			{ key: "c", name: "鈴木 花子" },
			{ key: "d", name: "田中 三郎", nameKana: "たなか さぶろう", amount: "5000" },
		]);
		expect(res.status).toBe(200);
		const [a, b, c, d] = await rowsOf(res);
		expect(a).toMatchObject({
			key: "a",
			status: "saved",
			receiptNo: 1,
			giftVersion: 1,
			personVersion: 1,
			values: { amount: "10,000", postalCode: "100-0001", address: "東京都千代田区千代田1-1" },
		});
		expect(b).toEqual({ key: "b", status: "skipped" });
		expect(c).toEqual({
			key: "c",
			status: "invalid",
			errors: { amount: "香典の金額を入力してください" },
		});
		expect(d).toMatchObject({ key: "d", status: "saved", receiptNo: 2 });
	});

	it("保存済みの行を直すと、表の列だけを変え、ほかの項目（電話など）は残す", async () => {
		const { taro, koudenId, save } = await setup();
		const [created] = await rowsOf(await save([{ key: "a", name: "佐藤 一郎", amount: "3000" }]));
		// 差出人の画面で電話を入れる（差出人の version が 2 になる）
		const personPath = `/k/${koudenId}/persons/${created?.personId}`;
		expect(
			(
				await taro.request(
					personPath,
					formPost({ version: "1", name: "佐藤 一郎", phone: "03-1234-5678" }),
				)
			).status,
		).toBe(303);

		const res = await save([
			{
				key: "a",
				giftId: created?.giftId,
				giftVersion: 1,
				personId: created?.personId,
				personVersion: 2,
				name: "佐藤 一郎",
				amount: "5,000",
				postalCode: "5300001",
				address: "大阪府大阪市北区梅田1-2-3",
			},
		]);
		const [updated] = await rowsOf(res);
		expect(updated).toMatchObject({
			status: "saved",
			giftVersion: 2,
			personVersion: 3,
			receiptNo: 1,
		});
		const person = await (await taro.request(personPath)).text();
		expect(person).toContain("03-1234-5678");
		expect(person).toContain("大阪府大阪市北区梅田1-2-3");
		expect(person).toContain("530-0001");
		const gifts = await (await taro.request(`/k/${koudenId}/gifts`)).text();
		expect(gifts).toContain("1 件・香典 ¥5,000");
	});

	it("開いた後に他の人が更新していたら、上書きせずに conflict を返す", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const [created] = await rowsOf(await save([{ key: "a", name: "a", amount: "3000" }]));
		await taro.request(
			`/k/${koudenId}/gifts/${created?.giftId}`,
			formPost({ version: "1", eventId, kind: "koden", amount: "4000" }),
		);
		const [stale] = await rowsOf(
			await save([
				{
					key: "a",
					giftId: created?.giftId,
					giftVersion: 1,
					personId: created?.personId,
					personVersion: 1,
					name: "a",
					amount: "9000",
				},
			]),
		);
		expect(stale).toMatchObject({ status: "conflict" });
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain("¥4,000");
	});

	it("無料版の上限を超えた行は limit を返し、それまでの行は保存する", async () => {
		const { save } = await setup();
		const rows = Array.from({ length: FREE_GIFT_LIMIT + 1 }, (_, i) => ({
			key: `r${i}`,
			name: `差出人${i}`,
			amount: "1000",
		}));
		const results = await rowsOf(await save(rows));
		expect(results.filter((r) => r.status === "saved")).toHaveLength(FREE_GIFT_LIMIT);
		expect(results.at(-1)).toMatchObject({ status: "limit" });
	});

	it("画面: 単名の香典は直せる行、供花・連名は読み取り専用の行で出す", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const [koden] = await rowsOf(await save([{ key: "a", name: "佐藤 一郎", amount: "10000" }]));
		await taro.request(
			`/k/${koudenId}/gifts`,
			formPost({ eventId, kind: "kyoka", name: "ABC 商事", itemName: "生花" }),
		);
		const html = await (await taro.request(`/k/${koudenId}/gifts/sheet`)).text();
		expect(html).toMatch(
			new RegExp(
				`<tr data-row="true" data-editable="1"[^>]*data-gift-id="${koden?.giftId}" data-gift-version="1"`,
			),
		);
		expect(html).toContain('value="10,000"');
		expect(html).toContain("供花は表では直せません。");
		expect(html).toContain('<template data-sheet-row="true">');
		expect(html).toContain("/assets/gift-sheet.js");
		// 一覧から表での入力へ（PC だけ出す）
		const list = await (await taro.request(`/k/${koudenId}/gifts`)).text();
		expect(list).toMatch(/<a href="\/k\/[^"]+\/gifts\/sheet" class="[^"]*max-md:hidden/);
	});

	it("団体名だけの差出人は、氏名の欄を空にして団体名を薄く出し、直しても団体名を氏名にしない", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const created = await taro.request(
			`/k/${koudenId}/gifts`,
			formPost({ eventId, kind: "koden", organization: "ABC 商事 一同", amount: "10000" }),
		);
		const giftId = new URL(created.headers.get("location") ?? "", "http://x").searchParams.get(
			"created",
		);
		const html = await (await taro.request(`/k/${koudenId}/gifts/sheet`)).text();
		const row = new RegExp(`<tr[^>]*data-gift-id="${giftId}"[\\s\\S]*?</tr>`).exec(html)?.[0] ?? "";
		expect(row).toMatch(/data-col="name"[^>]*value=""[^>]*placeholder="ABC 商事 一同"/);
		const personId = /data-person-id="([^"]+)"/.exec(row)?.[1];

		const [result] = await rowsOf(
			await save([
				{ key: "a", giftId, giftVersion: 1, personId, personVersion: 1, name: "", amount: "20000" },
			]),
		);
		expect(result).toMatchObject({ status: "saved", giftVersion: 2, personVersion: 1 });
		const person = await (await taro.request(`/k/${koudenId}/persons/${personId}`)).text();
		expect(person).toMatch(/name="name"[^>]*value=""/);
		expect(person).toMatch(/name="organization"[^>]*value="ABC 商事 一同"/);
	});

	it("同じ requestId の新しい行を送り直しても、二重に登録しない", async () => {
		const { taro, koudenId, save } = await setup();
		const row = {
			key: "new-0",
			requestId: "3f1d0c2e-0000-4000-8000-000000000001",
			name: "a",
			amount: "1000",
		};
		const [first] = await rowsOf(await save([row]));
		const [again] = await rowsOf(await save([row]));
		expect(again).toMatchObject({
			status: "saved",
			giftId: first?.giftId,
			personId: first?.personId,
			receiptNo: 1,
		});
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain(
			"1 件・香典 ¥1,000",
		);

		// 応答を待つ間に行を直してから送り直したら、作った記録に今の内容を重ねる（記録は 1 件のまま）
		const [edited] = await rowsOf(await save([{ ...row, amount: "2000", address: "東京都" }]));
		expect(edited).toMatchObject({
			status: "saved",
			giftId: first?.giftId,
			giftVersion: 2,
			personVersion: 2,
			values: { amount: "2,000", address: "東京都" },
		});
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain(
			"1 件・香典 ¥2,000",
		);
	});

	it("同じ差出人の 2 行をまとめて保存しても、後の行（金額だけの変更）を競合にしない", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const [first] = await rowsOf(await save([{ key: "a", name: "佐藤", amount: "1000" }]));
		// 同じ差出人の 2 件目（既存の差出人を選んで登録）
		await taro.request(
			`/k/${koudenId}/gifts`,
			formPost({ eventId, kind: "koden", personId: first?.personId ?? "", amount: "2000" }),
		);
		const html = await (await taro.request(`/k/${koudenId}/gifts/sheet`)).text();
		const secondGiftId = [...html.matchAll(/data-gift-id="([^"]+)"/g)]
			.map((m) => m[1])
			.find((id) => id !== first?.giftId);
		const base = { personId: first?.personId, personVersion: 1, name: "佐藤", address: "東京都" };
		const results = await rowsOf(
			await save([
				{ ...base, key: "a", giftId: first?.giftId, giftVersion: 1, amount: "1000" },
				{ ...base, key: "b", giftId: secondGiftId, giftVersion: 1, amount: "3000" },
			]),
		);
		expect(results).toMatchObject([
			{ key: "a", status: "saved", personVersion: 2 },
			{ key: "b", status: "saved", personVersion: 2, giftVersion: 2 },
		]);
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain(
			"2 件・香典 ¥4,000",
		);
	});

	it("写真の下書きを送り直したとき、待つ間に直した団体名も保存する", async () => {
		const { taro, koudenId, save } = await setup();
		const row = {
			key: "d1",
			requestId: "3f1d0c2e-0000-4000-8000-000000000002",
			organization: "A 商事",
			amount: "1000",
		};
		const [first] = await rowsOf(await save([row]));
		const [again] = await rowsOf(await save([{ ...row, organization: "B 商事 一同" }]));
		expect(again).toMatchObject({ status: "saved", giftId: first?.giftId, personVersion: 2 });
		const person = await (await taro.request(`/k/${koudenId}/persons/${first?.personId}`)).text();
		expect(person).toMatch(/name="organization"[^>]*value="B 商事 一同"/);
	});

	it("非表示にした関係は、その関係の差出人の行にだけ選択肢として残り、金額を直しても消えない", async () => {
		const { taro, koudenId, save } = await setup();
		const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
		const relationshipId =
			/<option value="([0-9a-f-]{36})"[^>]*>友人<\/option>/.exec(form)?.[1] ?? "";
		expect(relationshipId).not.toBe("");
		const [created] = await rowsOf(
			await save([{ key: "a", name: "佐藤", amount: "5000", relationshipId }]),
		);
		await taro.request(
			`/k/${koudenId}/relationships/${relationshipId}/hide`,
			formPost({ hidden: "1" }),
		);

		const html = await (await taro.request(`/k/${koudenId}/gifts/sheet`)).text();
		const row =
			new RegExp(`<tr[^>]*data-gift-id="${created?.giftId}"[\\s\\S]*?</tr>`).exec(html)?.[0] ?? "";
		expect(row).toMatch(
			new RegExp(`<option value="${relationshipId}" selected="">[^<]*（非表示）</option>`),
		);
		// 新しい行では選べない
		expect(html.match(/（非表示）<\/option>/g)).toHaveLength(1);

		const [updated] = await rowsOf(
			await save([
				{
					key: "a",
					giftId: created?.giftId,
					giftVersion: 1,
					personId: created?.personId,
					personVersion: 1,
					name: "佐藤",
					amount: "10000",
					relationshipId,
				},
			]),
		);
		expect(updated).toMatchObject({ status: "saved", giftVersion: 2, personVersion: 1 });
		const person = await (await taro.request(`/k/${koudenId}/persons/${created?.personId}`)).text();
		expect(person).toMatch(new RegExp(`<option value="${relationshipId}" selected="">`));
	});

	it("差出人と金額を一緒に直したとき、香典が他の人に更新されていれば、どちらも保存しない", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const [created] = await rowsOf(await save([{ key: "a", name: "佐藤", amount: "5000" }]));
		await taro.request(
			`/k/${koudenId}/gifts/${created?.giftId}`,
			formPost({ version: "1", eventId, kind: "koden", amount: "6000" }),
		);
		const [stale] = await rowsOf(
			await save([
				{
					key: "a",
					giftId: created?.giftId,
					giftVersion: 1,
					personId: created?.personId,
					personVersion: 1,
					name: "佐藤",
					amount: "7000",
					address: "東京都千代田区",
				},
			]),
		);
		expect(stale).toMatchObject({ status: "conflict" });
		const person = await (await taro.request(`/k/${koudenId}/persons/${created?.personId}`)).text();
		expect(person).not.toContain("東京都千代田区");
	});

	it("表で直せない行を API で直そうとしても変えない", async () => {
		const { taro, koudenId, eventId, save } = await setup();
		const created = await taro.request(
			`/k/${koudenId}/gifts`,
			formPost({ eventId, kind: "kyoka", name: "ABC 商事", itemName: "生花" }),
		);
		const giftId = new URL(created.headers.get("location") ?? "", "http://x").searchParams.get(
			"created",
		);
		const gift = await (await taro.request(`/k/${koudenId}/gifts/${giftId}`)).text();
		const personId = /\/persons\/([0-9a-f-]{36})/.exec(gift)?.[1];
		const [result] = await rowsOf(
			await save([
				{ key: "x", giftId, giftVersion: 1, personId, personVersion: 1, name: "x", amount: "1" },
			]),
		);
		expect(result).toMatchObject({ status: "error", message: "この記録は表では直せません" });
	});

	it("閲覧者は開けず、保存もできない。形の違う要求は 400、他のサイトからの要求は 403", async () => {
		const { taro, koudenId, eventId, save } = await setup();
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
		expect((await hanako.request(`/k/${koudenId}/gifts/sheet`)).status).toBe(403);
		expect((await save([{ key: "a", name: "x", amount: "1" }], hanako)).status).toBe(403);

		const bad = await taro.request(`/k/${koudenId}/gifts/sheet`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{",
		});
		expect(bad.status).toBe(400);
		// ログインしていても、他のサイト・Origin のない JSON の要求は拒否する
		const body = JSON.stringify({ eventId, rows: [{ key: "a", name: "x", amount: "1" }] });
		const cookie = taro.jar.header();
		const evil = await taro.app.request(
			`/k/${koudenId}/gifts/sheet`,
			{
				method: "POST",
				headers: { "content-type": "application/json", origin: "https://evil.example", cookie },
				body,
			},
			env,
		);
		const noOrigin = await taro.app.request(
			`/k/${koudenId}/gifts/sheet`,
			{ method: "POST", headers: { "content-type": "application/json", cookie }, body },
			env,
		);
		expect(noOrigin.status).toBe(403);
		expect(evil.status).toBe(403);
	});
});
