import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { formPost, HANAKO, makeApp, ORIGIN, TARO } from "./helpers.ts";

type Message = { type: string; [key: string]: unknown };

/** WebSocket で接続し、届いたメッセージを集める */
async function connect(client: ReturnType<typeof makeApp>, koudenId: string) {
	const res = await client.request(`/k/${koudenId}/ws`, {
		headers: { Upgrade: "websocket", Origin: ORIGIN },
	});
	expect(res.status).toBe(101);
	const ws = res.webSocket;
	if (!ws) throw new Error("no websocket");
	const messages: Message[] = [];
	const closed: { code?: number } = {};
	ws.addEventListener("message", (e) => messages.push(JSON.parse(e.data as string) as Message));
	ws.addEventListener("close", (e) => {
		closed.code = e.code;
	});
	ws.accept();
	const waitFor = async (pred: (m: Message) => boolean, timeout = 2000): Promise<Message> => {
		const started = Date.now();
		while (Date.now() - started < timeout) {
			const found = messages.find(pred);
			if (found) return found;
			await new Promise((r) => setTimeout(r, 10));
		}
		throw new Error(`timeout; got ${JSON.stringify(messages)}`);
	};
	return { ws, messages, closed, waitFor };
}

async function setupPair() {
	const taro = makeApp(TARO);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const reception = await (await taro.request(`/k/${koudenId}/reception`)).text();
	const eventId = /name="eventId" value="([^"]+)"/.exec(reception)?.[1] ?? "";
	const hanako = makeApp(HANAKO);
	await hanako.login();
	const hanakoId = (
		await env.DB.prepare("SELECT id FROM users WHERE email = ?")
			.bind(HANAKO.email)
			.first<{ id: string }>()
	)?.id;
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, 'editor', '')",
	)
		.bind(koudenId, hanakoId)
		.run();
	return { taro, hanako, koudenId, eventId, hanakoId: hanakoId ?? "" };
}

describe("リアルタイム同期", () => {
	it("他のメンバーの登録が通知され、閲覧中・編集中が共有される", async () => {
		const { taro, hanako, koudenId, eventId } = await setupPair();
		const t = await connect(taro, koudenId);
		await t.waitFor((m) => m.type === "hello");
		const h = await connect(hanako, koudenId);
		await t.waitFor((m) => m.type === "presence" && (m.users as unknown[]).length === 2);

		await hanako.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "鈴木", amount: "5000" }),
		);
		const changed = await t.waitFor((m) => m.type === "changed" && m.entity === "gift");
		expect(changed).toMatchObject({ op: "create" });

		h.ws.send(JSON.stringify({ type: "editing", entity: "gift", id: changed.id }));
		const presence = await t.waitFor(
			(m) =>
				m.type === "presence" &&
				(m.users as { editing: { id: string } | null }[]).some((u) => u.editing?.id === changed.id),
		);
		expect(presence).toBeTruthy();
		t.ws.close();
		h.ws.close();
	});

	it("htmx の要求に付いた画面（タブ）の識別子を通知に含める（そのタブだけが自分の変更を無視する）", async () => {
		const { taro, hanako, koudenId, eventId } = await setupPair();
		const t = await connect(taro, koudenId);
		await t.waitFor((m) => m.type === "hello");
		await hanako.request(`/k/${koudenId}/reception`, {
			...formPost({ eventId, kind: "koden", name: "a", amount: "1" }, { htmx: true }),
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"hx-request": "true",
				"x-tab-id": "tab-hanako-0001",
			},
		});
		const changed = await t.waitFor((m) => m.type === "changed" && m.entity === "gift");
		expect(changed.tab).toBe("tab-hanako-0001");
		t.ws.close();
	});

	it("除外されたメンバーの接続は revoked で閉じる", async () => {
		const { taro, hanako, koudenId, hanakoId } = await setupPair();
		const h = await connect(hanako, koudenId);
		await h.waitFor((m) => m.type === "hello");
		const res = await taro.request(`/k/${koudenId}/members/${hanakoId}/remove`, formPost({}));
		expect(res.status).toBe(303);
		await h.waitFor((m) => m.type === "revoked");
		expect((await hanako.request(`/k/${koudenId}`)).status).toBe(404);
	});

	it("他のサイトからの WebSocket 接続は拒否する", async () => {
		const { taro, koudenId } = await setupPair();
		const res = await taro.request(`/k/${koudenId}/ws`, {
			headers: { Upgrade: "websocket", Origin: "https://evil.example" },
		});
		expect(res.status).toBe(403);
	});

	it("画面には表示した時点の変更ログの位置を埋め込む（部分 HTML には埋め込まない）", async () => {
		const { taro, koudenId, eventId } = await setupPair();
		const seqOf = async () =>
			Number(
				/data-seq="(\d+)"/.exec(await (await taro.request(`/k/${koudenId}/gifts`)).text())?.[1],
			);
		const before = await seqOf();
		expect(before).toBeGreaterThan(0);
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "a", amount: "1" }),
		);
		expect(await seqOf()).toBe(before + 2);
		const partial = await (
			await taro.request(`/k/${koudenId}/gifts?partial=results`, {
				headers: { "hx-request": "true" },
			})
		).text();
		expect(partial).not.toContain("data-seq");
	});

	it("取りこぼした変更を since 以降で返す", async () => {
		const { taro, koudenId, eventId } = await setupPair();
		const before = (await (await taro.request(`/k/${koudenId}/changes?since=0`)).json()) as {
			changes: { seq: number }[];
		};
		const last = before.changes.at(-1)?.seq ?? 0;
		await taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name: "a", amount: "1" }),
		);
		const after = (await (await taro.request(`/k/${koudenId}/changes?since=${last}`)).json()) as {
			changes: { entity: string }[];
		};
		expect(after.changes.map((c) => c.entity)).toEqual(["person", "gift"]);
	});
});
