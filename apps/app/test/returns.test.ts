import { env, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ledgerFor } from "../src/ledger/client.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

const PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);

function multipart(fields: Record<string, string>, image?: { bytes: Uint8Array; name: string }) {
	const form = new FormData();
	for (const [k, v] of Object.entries(fields)) form.set(k, v);
	if (image) form.set("image", new File([image.bytes], image.name, { type: "image/png" }));
	return { method: "POST", body: form };
}

async function setup() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
	const eventId = /name="eventId"[^>]*><option value="([^"]+)"/.exec(form)?.[1] ?? "";
	const give = (name: string, amount: string) =>
		taro.request(`/k/${koudenId}/gifts`, formPost({ eventId, kind: "koden", name, amount }));
	return { taro, koudenId, eventId, give };
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
	return user?.id ?? "";
}

const imageUrls = (html: string) =>
	[...html.matchAll(/src="(\/k\/[^"]+\/files\/return-items\/[^"]+)"/g)].map((m) => m[1] ?? "");
const r2Keys = async (koudenId: string) =>
	(await env.FILES.list({ prefix: `koudens/${koudenId}/` })).objects.map((o) => o.key);

describe("返礼品カタログ（E6-1）", () => {
	it("画像付きで登録し、メンバーにだけ配信する。差し替え・削除で古い画像を消す", async () => {
		const { taro, koudenId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/return-items`,
			multipart(
				{ name: "今治タオル", price: "3,000", category: "タオル" },
				{ bytes: PNG, name: "a.png" },
			),
		);
		expect(res.status).toBe(303);
		const page = await (await taro.request(`/k/${koudenId}/returns/settings`)).text();
		expect(page).toContain("今治タオル");
		const [url] = imageUrls(page);
		expect(url).toBeTruthy();

		const image = await taro.request(url!);
		expect(image.status).toBe(200);
		expect(image.headers.get("content-type")).toBe("image/png");
		expect(image.headers.get("cache-control")).toContain("private");
		expect(new Uint8Array(await image.arrayBuffer())).toEqual(PNG);

		// メンバーでない人には見せない
		const hanako = makeApp(HANAKO);
		await hanako.login();
		expect((await hanako.request(url!)).status).toBe(404);

		// 差し替えると古い画像は消える
		const itemId = /action="\/k\/[^"]+\/return-items\/([0-9a-f-]{36})"/.exec(page)?.[1] ?? "";
		const version = /name="version" value="(\d+)"/.exec(
			page.slice(page.indexOf(`return-items/${itemId}"`)),
		)?.[1];
		const before = await r2Keys(koudenId);
		expect(before).toHaveLength(1);
		const replaced = await taro.request(
			`/k/${koudenId}/return-items/${itemId}`,
			multipart(
				{ version: version ?? "1", name: "今治タオル", price: "3000" },
				{ bytes: PNG, name: "b.png" },
			),
		);
		expect(replaced.status).toBe(303);
		const after = await r2Keys(koudenId);
		expect(after).toHaveLength(1);
		expect(after[0]).not.toBe(before[0]);
		expect((await taro.request(url!)).status).toBe(404);

		const deleted = await taro.request(
			`/k/${koudenId}/return-items/${itemId}/delete`,
			formPost({}),
		);
		expect(deleted.status).toBe(303);
		expect(await r2Keys(koudenId)).toEqual([]);
	});

	it("画像でないファイルは受け付けず、R2 にも残さない", async () => {
		const { taro, koudenId } = await setup();
		const res = await taro.request(
			`/k/${koudenId}/return-items`,
			multipart(
				{ name: "お茶", price: "2000" },
				{ bytes: new TextEncoder().encode("<svg onload=alert(1)>"), name: "x.png" },
			),
		);
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("JPEG・PNG・WebP");
		expect(await r2Keys(koudenId)).toEqual([]);
	});

	it("香典帳を削除すると画像も消える", async () => {
		const { taro, koudenId } = await setup();
		await taro.request(
			`/k/${koudenId}/return-items`,
			multipart({ name: "お茶", price: "2000" }, { bytes: PNG, name: "a.png" }),
		);
		expect(await r2Keys(koudenId)).toHaveLength(1);
		const res = await taro.request(
			`/k/${koudenId}/delete`,
			formPost({ confirm: "故 山田 一郎 様" }),
		);
		expect(res.status).toBe(303);
		expect(await r2Keys(koudenId)).toEqual([]);
	});
});

describe("香典返しの一括提案と状況（E6-2〜E6-4）", () => {
	it("ルールとカタログから提案し、当日返しを差し引いて一括確定する", async () => {
		const { taro, koudenId, give } = await setup();
		await give("高橋 一郎", "10000");
		await give("伊藤 次郎", "30000");
		await taro.request(`/k/${koudenId}/return-items`, multipart({ name: "お茶", price: "3000" }));
		await taro.request(`/k/${koudenId}/return-items`, multipart({ name: "タオル", price: "5000" }));
		const settings = await (await taro.request(`/k/${koudenId}/returns/settings`)).text();
		const teaId = /return-items\/([0-9a-f-]{36})"[^]*?お茶/.exec(settings)?.[1];
		// 2 万円以上は 3 分の 1 返しで、推奨品はお茶
		const rule = await taro.request(
			`/k/${koudenId}/return-rules`,
			formPost({ minAmount: "20000", maxAmount: "", ratio: "1/3", suggestedItemId: teaId ?? "" }),
		);
		expect(rule.status).toBe(303);

		const board = await (await taro.request(`/k/${koudenId}/returns`)).text();
		expect(board).toContain("一括提案（2 人）");
		// 1 万円 → 半返し 5,000 円 → タオル。3 万円 → 1/3 で推奨品のお茶
		const selected = (name: string) => {
			const row = board.slice(board.indexOf(name));
			return /<option value="[^"]+" selected="">([^（<]+)/.exec(row)?.[1];
		};
		expect(selected("高橋 一郎")).toBe("タオル");
		expect(selected("伊藤 次郎")).toBe("お茶");

		// 当日返し 2,000 円を差し引くと、1 万円の方の目安は 3,000 円になりお茶
		const withOnDay = await (await taro.request(`/k/${koudenId}/returns?onDay=2000`)).text();
		expect(withOnDay).toContain("¥3,000");

		const personIds = [...board.matchAll(/name="persons" value="([^"]+)"/g)].map((m) => m[1] ?? "");
		const form = new URLSearchParams({ onDay: "2000" });
		for (const id of personIds) {
			form.append("persons", id);
			const item = new RegExp(`name="item_${id}"[^]*?<option value="([^"]+)" selected`).exec(
				withOnDay,
			)?.[1];
			form.set(`item_${id}`, item ?? "");
		}
		const confirmed = await taro.request(`/k/${koudenId}/returns/confirm`, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: form.toString(),
		});
		expect(confirmed.status).toBe(303);
		const after = await (await taro.request(confirmed.headers.get("location") ?? "")).text();
		expect(after).toContain("2 件の香典返しを作成しました");
		expect(after).not.toContain("一括提案");
		expect(after).toMatch(/未対応 <span[^>]*>2</);

		// 状況で絞り込める
		const pendingOnly = await (await taro.request(`/k/${koudenId}/returns?status=shipped`)).text();
		expect(pendingOnly).toContain("該当する差出人はいません");
	});

	it("状況を発送済みにすると発送日が入り、競合したら違いを示して入力を残す", async () => {
		const { taro, koudenId, give } = await setup();
		await give("山田 太郎", "10000");
		const persons = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const personId = /\/persons\/([0-9a-f-]{36})"/.exec(persons)?.[1] ?? "";
		const created = await taro.request(`/k/${koudenId}/persons/${personId}/return`, formPost({}));
		expect(created.status).toBe(303);
		const path = created.headers.get("location") ?? "";

		const saved = await taro.request(path, formPost({ version: "1", status: "shipped" }));
		expect(saved.status).toBe(303);
		const page = await (await taro.request(path)).text();
		expect(page).toMatch(/name="shippedAt" type="date" value="\d{4}-\d{2}-\d{2}"/);
		expect(page).toContain("変更履歴（2 件）");

		const stale = await taro.request(
			path,
			formPost({ version: "1", status: "arranged", notes: "先に手配した" }),
		);
		expect(stale.status).toBe(409);
		const html = await stale.text();
		expect(html).toContain("開いている間に他の人がこの記録を更新しました");
		expect(html).toContain("先に手配した");
		expect(html).toContain('name="version" value="2"');

		// 明細の追加（品名と単価）・削除
		const line = await taro.request(
			`${path}/lines`,
			formPost({ version: "2", name: "お礼状", unitPrice: "150", quantity: "2" }),
		);
		expect(line.status).toBe(303);
		const withLine = await (await taro.request(path)).text();
		expect(withLine).toContain("お礼状");
		expect(withLine).toContain("¥300");
		const lineId = /lines\/([0-9a-f-]{36})\/delete/.exec(withLine)?.[1];
		const removed = await taro.request(
			`${path}/lines/${lineId}/delete`,
			formPost({ version: "3" }),
		);
		expect(removed.status).toBe(303);

		// 差出人の画面から香典返しへ移れる
		const person = await (await taro.request(`/k/${koudenId}/persons/${personId}`)).text();
		expect(person).toContain(path);

		const deleted = await taro.request(`${path}/delete`, formPost({ version: "4" }));
		expect(deleted.status).toBe(303);
		expect((await taro.request(path)).status).toBe(404);
	});

	it("閲覧者は提案・確定・状況の変更ができない", async () => {
		const { koudenId, give } = await setup();
		await give("山田 太郎", "10000");
		const hanako = makeApp(HANAKO);
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "viewer");
		const board = await (await hanako.request(`/k/${koudenId}/returns`)).text();
		expect(board).not.toContain("一括提案");
		const res = await hanako.request(
			`/k/${koudenId}/returns/confirm`,
			formPost({ persons: "x", onDay: "" }),
		);
		expect(res.status).toBe(403);
		const item = await hanako.request(
			`/k/${koudenId}/return-items`,
			multipart({ name: "a", price: "1" }),
		);
		expect(item.status).toBe(403);
	});

	it("閲覧者の画面にも、保存した当日返し・期限・電話番号を表示する", async () => {
		const { taro, koudenId, give } = await setup();
		await give("高橋 一郎", "10000");
		const persons = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const personId = /\/persons\/([0-9a-f-]{36})"/.exec(persons)?.[1] ?? "";
		const path =
			(await taro.request(`/k/${koudenId}/persons/${personId}/return`, formPost({}))).headers.get(
				"location",
			) ?? "";
		await taro.request(
			path,
			formPost({
				version: "1",
				status: "pending",
				onDayAmount: "2000",
				dueDate: "2026-12-20",
				shipPhone: "03-1234-5678",
			}),
		);
		const hanako = makeApp(HANAKO);
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "viewer");
		const page = await (await hanako.request(path)).text();
		expect(page).not.toContain('name="status"');
		expect(page).toContain("¥2,000");
		expect(page).toContain("2026年12月20日");
		expect(page).toContain("03-1234-5678");
	});

	it("期限は取り直す部分の中にあり、行事の変更で取り直される", async () => {
		const { taro, koudenId } = await setup();
		const before = await (await taro.request(`/k/${koudenId}/returns?partial=board`)).text();
		expect(before).toContain('data-live="gift,person,event,');
		expect(before).toContain("四十九日に日付を入れると");
		await taro.request(
			`/k/${koudenId}/events`,
			formPost({ kind: "memorial_49", name: "", date: "2026-12-20" }),
		);
		const after = await (await taro.request(`/k/${koudenId}/returns?partial=board`)).text();
		expect(after).toContain("2026年12月20日");
	});

	it("差出人の画面の香典返しの欄は、部分だけを取り直せる", async () => {
		const { taro, koudenId, give } = await setup();
		await give("高橋 一郎", "10000");
		const persons = await (await taro.request(`/k/${koudenId}/persons`)).text();
		const personId = /\/persons\/([0-9a-f-]{36})"/.exec(persons)?.[1] ?? "";
		const url = `/k/${koudenId}/persons/${personId}?partial=return`;
		const before = await (await taro.request(url)).text();
		expect(before).toContain("香典返しを作成");
		expect(before).not.toContain("<html");
		await taro.request(`/k/${koudenId}/persons/${personId}/return`, formPost({}));
		const after = await (await taro.request(url)).text();
		expect(after).toContain("香典返しを開く");
		expect(after).toContain('data-live="return"');
	});
});

describe("期限のお知らせの設定（E6-5）", () => {
	it("編集者は自分で受け取るかを切り替えられる（オーナーは常に受け取る）", async () => {
		const { taro, koudenId } = await setup();
		const hanako = makeApp(HANAKO);
		await hanako.login();
		const hanakoId = await addMember(koudenId, HANAKO.email, "editor");
		const page = await (await hanako.request(`/k/${koudenId}/members`)).text();
		expect(page).toContain("お知らせを受け取る");

		const res = await hanako.request(
			`/k/${koudenId}/members/me/notifications`,
			formPost({ on: "1" }),
		);
		expect(res.status).toBe(303);
		const row = await env.DB.prepare(
			"SELECT notify_reminders FROM kouden_members WHERE kouden_id = ? AND user_id = ?",
		)
			.bind(koudenId, hanakoId)
			.first();
		expect(row).toEqual({ notify_reminders: 1 });
		expect(await (await hanako.request(`/k/${koudenId}/members`)).text()).toContain(
			"お知らせを受け取らない",
		);
		// 他の画面（オーナーのメンバー一覧など）が取り直せるよう、変更を記録して知らせる
		const logged = await runInDurableObject(ledgerFor(env, koudenId), (_obj, state) =>
			state.storage.sql
				.exec<{ entity: string; entity_id: string }>(
					"SELECT entity, entity_id FROM change_log ORDER BY seq DESC LIMIT 1",
				)
				.toArray(),
		);
		expect(logged).toEqual([{ entity: "member", entity_id: hanakoId }]);

		const owner = await taro.request(
			`/k/${koudenId}/members/me/notifications`,
			formPost({ on: "0" }),
		);
		expect(owner.status).toBe(403);

		// アーカイブ中は閲覧のみ（お知らせも送らない）
		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }));
		const archived = await hanako.request(
			`/k/${koudenId}/members/me/notifications`,
			formPost({ on: "0" }),
		);
		expect(archived.status).toBe(403);
		expect(await (await hanako.request(`/k/${koudenId}/members`)).text()).toContain(
			"アーカイブ中はお知らせを送りません",
		);
	});
});
