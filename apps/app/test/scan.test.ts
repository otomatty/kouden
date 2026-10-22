import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { PhotoReader } from "../src/photo/reader.ts";
import { PHOTO_MAX_BYTES } from "../src/routes/scan.tsx";
import type { AppDeps } from "../src/types.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

/** ログインして香典帳を 1 冊作る。photoReader で読み取りの実装を差し替えられる */
async function setup(deps: Pick<AppDeps, "photoReader"> = {}) {
	const taro = makeApp(TARO, undefined, deps);
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎", title: "" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const read = (body: BodyInit, type = "image/jpeg", client = taro) =>
		client.request(`/k/${koudenId}/gifts/read`, {
			method: "POST",
			headers: { "content-type": type },
			body,
		});
	return { taro, koudenId, read };
}

const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

describe("写真で登録（08 案 D）", () => {
	it("画面を出し、この画面だけカメラを許す。登録の画面・一覧から開ける", async () => {
		const { taro, koudenId } = await setup();
		const res = await taro.request(`/k/${koudenId}/gifts/scan`);
		expect(res.status).toBe(200);
		expect(res.headers.get("permissions-policy")).toContain("camera=(self)");
		const html = await res.text();
		expect(html).toContain(`data-read-url="/k/${koudenId}/gifts/read"`);
		expect(html).toContain(`data-save-url="/k/${koudenId}/gifts/sheet"`);
		expect(html).toContain("/assets/gift-scan.js");
		expect(html).toContain("写真は読み取りに使うだけで、保存しません");

		const entry = await taro.request(`/k/${koudenId}/gifts/new`);
		expect(entry.headers.get("permissions-policy")).toContain("camera=()");
		expect(await entry.text()).toMatch(/href="\/k\/[^"]+\/gifts\/scan\?event=[^"]+"/);
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).toContain(
			`href="/k/${koudenId}/gifts/scan"`,
		);
	});

	it("読み取った内容を下書きの形（金額・郵便番号をそろえる）で返し、保存させない", async () => {
		const seen: { type?: string; size?: number } = {};
		const reader: PhotoReader = {
			read: async ({ bytes, type }) => {
				seen.type = type;
				seen.size = bytes.byteLength;
				return {
					name: "佐藤　一郎",
					amount: "金壱萬円",
					postalCode: "１００ー０００１",
					address: "東京都千代田区千代田1-1",
				};
			},
		};
		const { read } = await setup({ photoReader: () => reader });
		const res = await read(PHOTO);
		expect(res.status).toBe(200);
		expect(res.headers.get("cache-control")).toBe("no-store");
		expect(await res.json()).toEqual({
			draft: {
				name: "佐藤 一郎",
				nameKana: "",
				organization: "",
				amount: "10,000",
				postalCode: "100-0001",
				address: "東京都千代田区千代田1-1",
			},
		});
		expect(seen).toEqual({ type: "image/jpeg", size: PHOTO.byteLength });
	});

	it("写真でない・大きすぎる・空の要求は断り、読み取りの失敗・おかしな出力は 502 にする", async () => {
		const { read } = await setup();
		expect((await read(PHOTO, "text/plain")).status).toBe(415);
		expect((await read(PHOTO, "application/pdf")).status).toBe(415);
		expect((await read(new Uint8Array(PHOTO_MAX_BYTES + 1))).status).toBe(413);
		expect((await read(new Uint8Array(0))).status).toBe(400);

		const failing = await setup({
			photoReader: () => ({
				read: async () => {
					throw new Error("upstream");
				},
			}),
		});
		const failed = await failing.read(PHOTO);
		expect(failed.status).toBe(502);
		expect(await failed.json()).toEqual({ error: "read_failed" });

		const odd = await setup({
			photoReader: () => ({ read: async () => ({ name: 1 }) as never }),
		});
		expect((await odd.read(PHOTO)).status).toBe(502);
	});

	it("下書きは表で入力と同じ API で登録でき、団体名も保存する", async () => {
		const { taro, koudenId } = await setup();
		const form = await (await taro.request(`/k/${koudenId}/gifts/new`)).text();
		const eventId = /name="eventId"(?:[^>]*><option)? value="([^"]+)"/.exec(form)?.[1] ?? "";
		const res = await taro.request(`/k/${koudenId}/gifts/sheet`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				eventId,
				rows: [{ key: "d1", organization: "株式会社 見本商事 一同", amount: "30,000" }],
			}),
		});
		const { rows } = (await res.json()) as { rows: { status: string; personId: string }[] };
		expect(rows[0]).toMatchObject({ status: "saved" });
		const person = await (await taro.request(`/k/${koudenId}/persons/${rows[0]?.personId}`)).text();
		expect(person).toMatch(/name="organization"[^>]*value="株式会社 見本商事 一同"/);
	});

	it("読み取りが無効なら画面・API・リンクを出さない", async () => {
		const { taro, koudenId, read } = await setup({ photoReader: () => null });
		expect((await taro.request(`/k/${koudenId}/gifts/scan`)).status).toBe(404);
		expect((await read(PHOTO)).status).toBe(404);
		expect(await (await taro.request(`/k/${koudenId}/gifts/new`)).text()).not.toContain(
			"写真で登録する",
		);
		expect(await (await taro.request(`/k/${koudenId}/gifts`)).text()).not.toContain(
			"写真で登録する",
		);
	});

	it("閲覧者は開けず、読み取れない。他のサイトからの要求は 403", async () => {
		const { taro, koudenId, read } = await setup();
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
		expect((await hanako.request(`/k/${koudenId}/gifts/scan`)).status).toBe(403);
		expect((await read(PHOTO, "image/jpeg", hanako)).status).toBe(403);
		expect(await (await hanako.request(`/k/${koudenId}/gifts`)).text()).not.toContain(
			"写真で登録する",
		);

		const evil = await taro.app.request(
			`/k/${koudenId}/gifts/read`,
			{
				method: "POST",
				headers: {
					"content-type": "image/jpeg",
					origin: "https://evil.example",
					cookie: taro.jar.header(),
				},
				body: PHOTO,
			},
			env,
		);
		expect(evil.status).toBe(403);
	});
});
