import { env, runInDurableObject } from "cloudflare:test";
import {
	IMPORT_USERS_PER_REQUEST,
	giftPhotoKey,
	expectedImportState,
	importDifferences,
	type ImportKoudenPayload,
	type ImportUser,
} from "@kouden/domain";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.tsx";
import { ledgerFor } from "../src/ledger/client.ts";
import { importAccessVerifier } from "../src/migration/auth.ts";
import { makeApp } from "./helpers.ts";
import { deleteKoudenFiles } from "../src/kouden/files.ts";

const TOKEN = { Authorization: "Bearer test-import-token" };

/** 取り込み口を呼ぶ（移行ツールの代わり）。env を差し替えて設定ごとの動作を確かめる */
function call(
	path: string,
	init: RequestInit & { json?: unknown } = {},
	overrides: Partial<Env> = {},
	deps: Parameters<typeof createApp>[0] = {},
) {
	const headers = new Headers(init.headers);
	let body = init.body;
	if (init.json !== undefined) {
		headers.set("content-type", "application/json");
		body = JSON.stringify(init.json);
	}
	return createApp(deps).request(path, { ...init, headers, body }, { ...env, ...overrides });
}

let seq = 0;
/** テストごとに別の ID（同じ D1 を共有するため） */
function ids() {
	seq += 1;
	const p = `t${seq}-${crypto.randomUUID().slice(0, 8)}`;
	return {
		owner: `${p}-owner`,
		editor: `${p}-editor`,
		kouden: `${p}-kouden`,
		event: `${p}-event`,
		event49: `${p}-event49`,
		rel: `${p}-rel`,
		p1: `${p}-p1`,
		p2: `${p}-p2`,
		g1: `${p}-g1`,
		g2: `${p}-g2`,
		g3: `${p}-g3`,
		item: `${p}-item`,
		rule: `${p}-rule`,
		ret: `${p}-ret`,
		line: `${p}-line`,
		purchase: `${p}-purchase`,
		sub: `${p}-google-sub`,
		email: `${p}@gmail.com`,
	};
}

function users(i: ReturnType<typeof ids>): ImportUser[] {
	return [
		{
			id: i.owner,
			legacyUserId: `${i.owner}-legacy`,
			email: `${i.owner}@example.com`,
			displayName: "山田 太郎",
			googleSub: i.sub,
			createdAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: i.editor,
			legacyUserId: `${i.editor}-legacy`,
			email: i.email,
			displayName: "佐藤 花子",
			googleSub: null,
			createdAt: "2024-02-01T00:00:00.000Z",
		},
	];
}

function koudenPayload(i: ReturnType<typeof ids>, futureDate: string): ImportKoudenPayload {
	const audit = {
		createdBy: i.owner,
		createdAt: "2024-03-01T00:00:00.000Z",
		updatedBy: i.owner,
		updatedAt: "2024-03-02T00:00:00.000Z",
	};
	return {
		koudenId: i.kouden,
		kouden: {
			legacyKoudenId: `${i.kouden}-legacy`,
			title: "故 山田 一郎 様",
			deceasedName: "山田 一郎",
			ownerUserId: i.owner,
			status: "active",
			createdAt: "2024-03-01T00:00:00.000Z",
			updatedAt: "2024-03-02T00:00:00.000Z",
		},
		members: [
			{ userId: i.owner, role: "owner", joinedAt: "2024-03-01T00:00:00.000Z", invitedBy: null },
			{
				userId: i.editor,
				role: "editor",
				joinedAt: "2024-03-05T00:00:00.000Z",
				invitedBy: i.owner,
			},
		],
		purchases: [
			{
				id: i.purchase,
				userId: i.owner,
				amount: 2980,
				stripeCheckoutSessionId: `cs_${i.purchase}`,
				createdAt: "2024-03-03T00:00:00.000Z",
			},
		],
		ledger: {
			events: [
				{ id: i.event, kind: "funeral", name: "葬儀", date: null, sortOrder: 1 },
				{ id: i.event49, kind: "memorial_49", name: "四十九日", date: futureDate, sortOrder: 2 },
			],
			relationships: [{ id: i.rel, name: "親族", sortOrder: 1, isHidden: false }],
			persons: [
				{
					id: i.p1,
					name: "佐藤 一郎",
					nameKana: null,
					organization: null,
					position: null,
					relationshipId: i.rel,
					postalCode: "100-0001",
					address: "東京都千代田区1-1",
					phone: null,
					notes: null,
					...audit,
				},
				{
					id: i.p2,
					name: null,
					nameKana: null,
					organization: "株式会社サンプル",
					position: null,
					relationshipId: null,
					postalCode: null,
					address: null,
					phone: null,
					notes: null,
					...audit,
				},
			],
			gifts: [
				{
					id: i.g1,
					eventId: i.event,
					kind: "koden",
					amount: 10000,
					itemName: null,
					quantity: null,
					message: null,
					attendance: "attended",
					notes: null,
					...audit,
				},
				{
					id: i.g2,
					eventId: i.event,
					kind: "kyoka",
					amount: 15000,
					itemName: "供花一対",
					quantity: 1,
					message: null,
					attendance: null,
					notes: null,
					...audit,
				},
				{
					id: i.g3,
					eventId: i.event,
					kind: "choden",
					amount: null,
					itemName: null,
					quantity: null,
					message: "ご冥福をお祈りします",
					attendance: null,
					notes: null,
					...audit,
				},
			],
			contributors: [
				{ giftId: i.g1, personId: i.p1, isPrimary: true, shareAmount: null },
				{ giftId: i.g2, personId: i.p2, isPrimary: true, shareAmount: null },
				{ giftId: i.g3, personId: i.p2, isPrimary: true, shareAmount: null },
			],
			returnItems: [
				{
					id: i.item,
					name: "タオルセット",
					category: null,
					price: 3000,
					description: null,
					imageR2Key: null,
					isActive: true,
					sortOrder: 1,
					createdAt: audit.createdAt,
					updatedAt: audit.updatedAt,
				},
			],
			returnRules: [
				{
					id: i.rule,
					minAmount: 5000,
					maxAmount: 10000,
					ratioNumerator: 1,
					ratioDenominator: 2,
					suggestedItemId: i.item,
					sortOrder: 1,
				},
			],
			returns: [
				{
					id: i.ret,
					personId: i.p1,
					status: "arranged",
					method: "shipping",
					onDayAmount: 2000,
					arrangedAt: "2024-03-10",
					shippedAt: null,
					shipName: null,
					shipPostalCode: "100-0001",
					shipAddress: "東京都千代田区1-1",
					shipPhone: null,
					notes: "旧アプリの備考",
					...audit,
				},
			],
			returnLines: [
				{
					id: i.line,
					returnId: i.ret,
					returnItemId: i.item,
					name: "タオルセット",
					unitPrice: 3000,
					quantity: 1,
				},
			],
		},
	};
}

const future = () => new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);

async function importAll(i: ReturnType<typeof ids>, payload = koudenPayload(i, future())) {
	const u = await call("/internal/import/users", {
		method: "POST",
		headers: TOKEN,
		json: { users: users(i) },
	});
	expect(u.status).toBe(200);
	const k = await call(`/internal/import/koudens/${i.kouden}`, {
		method: "PUT",
		headers: TOKEN,
		json: payload,
	});
	expect(k.status).toBe(200);
	return (await k.json()) as { ledger: Record<string, unknown> };
}

describe("取り込み口の認証（05 §2）", () => {
	it("トークンも Access も設定されていなければ、取り込み口はない（404）", async () => {
		const res = await call(
			"/internal/import/users",
			{ method: "POST", headers: TOKEN, json: { users: [] } },
			{ IMPORT_DEV_TOKEN: "" },
		);
		expect(res.status).toBe(404);
	});

	it("開発用トークンが違えば 403。ブラウザからの要求ではないので Origin は見ない", async () => {
		const wrong = await call("/internal/import/users", {
			method: "POST",
			headers: { Authorization: "Bearer wrong" },
			json: { users: [] },
		});
		expect(wrong.status).toBe(403);
		const none = await call("/internal/import/users", { method: "POST", json: { users: [] } });
		expect(none.status).toBe(403);
		const ok = await call("/internal/import/users", {
			method: "POST",
			headers: TOKEN,
			json: { users: [] },
		});
		expect(ok.status).toBe(200);
	});

	it("Access のサービストークンの JWT を検証する（iss・aud・署名）", async () => {
		const { publicKey, privateKey } = await generateKeyPair("RS256");
		const jwk = { ...(await exportJWK(publicKey)), kid: "k", alg: "RS256" };
		const keys = createLocalJWKSet({ keys: [jwk] });
		const overrides = {
			IMPORT_DEV_TOKEN: "",
			IMPORT_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
			IMPORT_ACCESS_AUD: "import-aud",
		};
		const deps = {
			verifyImportAccess: () =>
				importAccessVerifier({ teamDomain: "team.cloudflareaccess.com", aud: "import-aud", keys }),
		};
		const jwt = (aud: string) =>
			new SignJWT({ common_name: "migration-tool.access" })
				.setProtectedHeader({ alg: "RS256", kid: "k" })
				.setIssuer("https://team.cloudflareaccess.com")
				.setAudience(aud)
				.setExpirationTime("5m")
				.sign(privateKey);
		const send = async (headers: Record<string, string>) =>
			(
				await call(
					"/internal/import/users",
					{ method: "POST", headers, json: { users: [] } },
					overrides,
					deps,
				)
			).status;
		expect(await send({})).toBe(403);
		expect(await send({ "Cf-Access-Jwt-Assertion": await jwt("other-aud") })).toBe(403);
		// 開発用トークンは staging / production では使えない
		expect(await send(TOKEN)).toBe(403);
		expect(await send({ "Cf-Access-Jwt-Assertion": await jwt("import-aud") })).toBe(200);
	});
});

describe("旧データの取り込み（05 §2・§3）", () => {
	it("読み戻しでユーザー・メンバーの権限変更と金額の差を検出できる", async () => {
		const i = ids();
		const payload = koudenPayload(i, future());
		await importAll(i, payload);
		const verifyUsers = () =>
			call("/internal/import/users/verify", {
				method: "POST",
				headers: TOKEN,
				json: { users: users(i) },
			});
		expect(await (await verifyUsers()).json()).toEqual({ checked: 2, differences: [] });
		const state = async () =>
			(await call(`/internal/import/koudens/${i.kouden}`, { headers: TOKEN })).json();
		expect(importDifferences(expectedImportState(payload), await state())).toEqual([]);
		await env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?")
			.bind("変更済み", i.owner)
			.run();
		expect(await (await verifyUsers()).json()).toEqual({
			checked: 2,
			differences: ["users[0].user.displayName"],
		});
		await env.DB.prepare(
			"UPDATE kouden_members SET role = 'viewer' WHERE kouden_id = ? AND user_id = ?",
		)
			.bind(i.kouden, i.editor)
			.run();
		await env.DB.prepare("UPDATE purchases SET amount = 1 WHERE id = ?").bind(i.purchase).run();
		const diff = importDifferences(expectedImportState(payload), await state());
		expect(diff).toContain("d1.purchaseRows[0].amount");
		expect(diff.some((path) => path.startsWith("d1.memberRows") && path.endsWith(".role"))).toBe(
			true,
		);
	});

	it("確認用 API も認証で保護し、不正なユーザー入力は拒否する", async () => {
		for (const path of [
			"/internal/import/summary",
			"/internal/import/files?key=x",
			"/internal/import/koudens/k1/files",
		]) {
			expect((await call(path)).status).toBe(403);
			expect((await call(path, {}, { IMPORT_DEV_TOKEN: "" })).status).toBe(404);
		}
		expect(
			(
				await call("/internal/import/users/verify", {
					method: "POST",
					headers: TOKEN,
					json: { users: [{}] },
				})
			).status,
		).toBe(400);
	});

	it("供物写真を保存・照合・再投入し、メンバーだけに表示する", async () => {
		const i = ids();
		await importAll(i);
		const payload = koudenPayload(i, future());
		const photoId = crypto.randomUUID();
		const key = giftPhotoKey(i.kouden, i.g2, photoId);
		payload.ledger.giftPhotos = [
			{
				id: photoId,
				giftId: i.g2,
				r2Key: key,
				caption: "<script>供花</script>",
				createdBy: i.owner,
				createdAt: "2024-03-01T00:00:00.000Z",
				updatedAt: "2024-03-02T00:00:00.000Z",
			},
		];
		const put = () =>
			call(`/internal/import/koudens/${i.kouden}`, {
				method: "PUT",
				headers: TOKEN,
				json: payload,
			});
		// 台帳や名前の更新前に、未転送の写真を拒否する。
		payload.kouden.title = "写真付きの台帳";
		expect((await put()).status).toBe(409);
		expect(
			await env.DB.prepare("SELECT title FROM koudens WHERE id = ?").bind(i.kouden).first("title"),
		).toBe("故 山田 一郎 様");
		const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
			b.toString(16).padStart(2, "0"),
		).join("");
		expect(
			(
				await call(`/internal/import/files?key=${encodeURIComponent(key)}`, {
					method: "PUT",
					headers: { ...TOKEN, "X-Content-SHA256": hash },
					body: bytes,
				})
			).status,
		).toBe(200);
		for (let repeat = 0; repeat < 2; repeat++) expect((await put()).status).toBe(200);
		const state = await (
			await call(`/internal/import/koudens/${i.kouden}`, { headers: TOKEN })
		).json();
		expect(importDifferences(expectedImportState(payload), state)).toEqual([]);
		const owner = makeApp({
			sub: i.sub,
			email: `${i.owner}@gmail.com`,
			emailVerified: true,
			name: "写真の所有者",
		});
		const imagePath = `/k/${i.kouden}/files/gifts/${i.g2}/${photoId}`;
		expect((await owner.request(imagePath)).status).toBe(302);
		await owner.login();
		const html = await (await owner.request(`/k/${i.kouden}/gifts/${i.g2}`)).text();
		expect(html).toContain(imagePath);
		expect(html).toContain("&lt;script&gt;供花&lt;/script&gt;");
		const image = await owner.request(imagePath);
		expect(image.status).toBe(200);
		expect(image.headers.get("content-type")).toBe("image/png");
		expect(image.headers.get("cache-control")).toBe("private, no-store");
		expect(new Uint8Array(await image.arrayBuffer())).toEqual(bytes);
		expect((await owner.request(`/k/${i.kouden}/files/gifts/${i.g1}/${photoId}`)).status).toBe(404);
		// 閲覧者・アーカイブ中でも閲覧できる。メンバーから外れると配信しない。
		const viewer = makeApp({
			sub: `${i.sub}-viewer`,
			email: i.email,
			emailVerified: true,
			name: "閲覧者",
		});
		await viewer.login();
		await env.DB.prepare(
			"UPDATE kouden_members SET role = 'viewer' WHERE kouden_id = ? AND user_id = ?",
		)
			.bind(i.kouden, i.editor)
			.run();
		await env.DB.prepare("UPDATE koudens SET status = 'archived' WHERE id = ?")
			.bind(i.kouden)
			.run();
		expect((await viewer.request(imagePath)).status).toBe(200);
		await env.DB.prepare("DELETE FROM kouden_members WHERE kouden_id = ? AND user_id = ?")
			.bind(i.kouden, i.editor)
			.run();
		expect((await viewer.request(imagePath)).status).toBe(404);
		// 別台帳への参照や写真の取り違えは、D1 の更新前に拒否する。
		payload.ledger.giftPhotos[0]!.r2Key = giftPhotoKey("other", i.g2, photoId);
		expect((await put()).status).toBe(400);
		payload.ledger.giftPhotos[0]!.r2Key = key;
		await runInDurableObject(ledgerFor(env, i.kouden), (_instance, ctx) => {
			ctx.storage.sql.exec(
				"UPDATE gifts SET deleted_at = ? WHERE id = ?",
				new Date().toISOString(),
				i.g2,
			);
		});
		expect((await owner.request(imagePath)).status).toBe(404);
		expect(await deleteKoudenFiles(env, i.kouden)).toBe(1);
		expect(await env.FILES.head(key)).toBeNull();
	});

	it("画像は再投入でき、R2からサイズとSHA-256を読み戻せる", async () => {
		const key = `koudens/${crypto.randomUUID()}/return-items/${crypto.randomUUID()}`;
		const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
			b.toString(16).padStart(2, "0"),
		).join("");
		const path = `/internal/import/files?key=${encodeURIComponent(key)}`;
		for (let repeat = 0; repeat < 2; repeat++) {
			const result = await call(path, {
				method: "PUT",
				headers: { ...TOKEN, "X-Content-SHA256": hash },
				body: bytes,
			});
			expect(result.status).toBe(200);
		}
		expect(await (await call(path, { headers: TOKEN })).json()).toEqual({
			key,
			size: bytes.length,
			sha256: hash,
		});
		const listing = await call(`/internal/import/koudens/${key.split("/")[1]}/files`, {
			headers: TOKEN,
		});
		expect(await listing.json()).toEqual({ objects: [{ key, size: bytes.length }], cursor: null });
		expect(
			(
				await call(path, {
					method: "PUT",
					headers: { ...TOKEN, "X-Content-SHA256": "0".repeat(64) },
					body: bytes,
				})
			).status,
		).toBe(400);
		expect(
			(
				await call("/internal/import/files?key=outside/path", {
					method: "PUT",
					headers: { ...TOKEN, "X-Content-SHA256": hash },
					body: bytes,
				})
			).status,
		).toBe(400);
		// チェックサムが異なる要求は既存の画像を上書きしない。
		expect(await (await call(path, { headers: TOKEN })).json()).toMatchObject({ sha256: hash });
	});

	it("D1 と台帳に入り、件数・統計・期限のお知らせが揃う", async () => {
		const i = ids();
		const { ledger } = await importAll(i);
		expect(ledger).toMatchObject({
			events: 2,
			relationships: 1,
			persons: 2,
			gifts: { koden: 1, kumotsu: 0, kyoka: 1, choden: 1, other: 0 },
			kodenTotal: 10000,
			returns: { pending: 0, arranged: 1, shipped: 0, handed_on_day: 0, not_required: 0 },
			returnLines: 1,
			returnItems: 1,
			returnRules: 1,
			// 四十九日の 14 日前・3 日前
			reminders: 2,
		});

		const kouden = await env.DB.prepare("SELECT * FROM koudens WHERE id = ?")
			.bind(i.kouden)
			.first();
		expect(kouden).toMatchObject({
			plan: "paid",
			owner_user_id: i.owner,
			deceased_name: "山田 一郎",
		});
		const stats = await env.DB.prepare("SELECT * FROM kouden_stats WHERE kouden_id = ?")
			.bind(i.kouden)
			.first();
		expect(stats).toMatchObject({ gift_count: 3, total_amount: 10000, person_count: 2 });
		const purchase = await env.DB.prepare("SELECT * FROM purchases WHERE id = ?")
			.bind(i.purchase)
			.first();
		expect(purchase).toMatchObject({ source: "legacy", status: "paid", amount: 2980 });

		// Google でログインしていた人は紐づき済み、メールログインだった人は未紐づけ
		const legacy = await env.DB.prepare(
			"SELECT legacy_user_id, auth_provider, linked_user_id, linked_by FROM legacy_users WHERE legacy_user_id IN (?, ?) ORDER BY auth_provider",
		)
			.bind(`${i.owner}-legacy`, `${i.editor}-legacy`)
			.all();
		expect(legacy.results).toEqual([
			{
				legacy_user_id: `${i.editor}-legacy`,
				auth_provider: "email",
				linked_user_id: null,
				linked_by: null,
			},
			{
				legacy_user_id: `${i.owner}-legacy`,
				auth_provider: "google",
				linked_user_id: i.owner,
				linked_by: "import",
			},
		]);

		const check = await call(`/internal/import/koudens/${i.kouden}`, { headers: TOKEN });
		expect(await check.json()).toMatchObject({
			d1: { plan: "paid", members: { owner: 1, editor: 1, viewer: 0 }, paidPurchases: 1 },
			ledger: { persons: 2 },
		});
	});

	it("何度取り込んでも同じ結果になり、変更ログは import の 1 行だけ", async () => {
		const i = ids();
		const first = await importAll(i);
		const second = await importAll(i);
		expect(second.ledger).toEqual(first.ledger);
		const log = await runInDurableObject(ledgerFor(env, i.kouden), (_obj, state) =>
			state.storage.sql
				.exec<{ entity: string; op: string; actor_name: string }>(
					"SELECT entity, op, actor_name FROM change_log",
				)
				.toArray(),
		);
		expect(log).toEqual([{ entity: "kouden", op: "import", actor_name: "データ移行" }]);
		const members = await env.DB.prepare(
			"SELECT count(*) AS n FROM kouden_members WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.first();
		expect(members).toEqual({ n: 2 });
	});

	it("Google でログインしていた人は、そのままログインして香典帳を開ける", async () => {
		const i = ids();
		await importAll(i);
		const owner = makeApp({
			sub: i.sub,
			email: `${i.owner}@gmail.com`,
			emailVerified: true,
			name: "x",
		});
		await owner.login();
		const list = await (await owner.request("/")).text();
		expect(list).toContain("故 山田 一郎 様");
		const persons = await (await owner.request(`/k/${i.kouden}/persons`)).text();
		expect(persons).toContain("佐藤 一郎");
		expect(persons).toContain("株式会社サンプル");
	});

	it("メールログインだった人は、同じ Gmail の Google アカウントで初回ログインすると紐づく。再取り込みでも外れない", async () => {
		const i = ids();
		await importAll(i);
		const editor = makeApp({
			sub: `${i.sub}-editor`,
			email: i.email,
			emailVerified: true,
			name: "x",
		});
		await editor.login();
		expect(await (await editor.request(`/k/${i.kouden}`)).text()).toContain("編集者");

		await importAll(i);
		const user = await env.DB.prepare("SELECT google_sub FROM users WHERE id = ?")
			.bind(i.editor)
			.first();
		expect(user).toEqual({ google_sub: `${i.sub}-editor` });
		const legacy = await env.DB.prepare(
			"SELECT linked_user_id, linked_by FROM legacy_users WHERE legacy_user_id = ?",
		)
			.bind(`${i.editor}-legacy`)
			.first();
		expect(legacy).toEqual({ linked_user_id: i.editor, linked_by: "auto" });
	});

	it("D1 に書けない理由（メンバーのユーザーが未登録）を JSON で返す", async () => {
		const i = ids();
		const res = await call(`/internal/import/koudens/${i.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: koudenPayload(i, future()),
		});
		expect(res.status).toBe(500);
		expect(await res.json()).toMatchObject({
			error: "kouden_import_failed",
			message: expect.stringContaining("FOREIGN KEY"),
		});
	});

	it("URL の香典帳と取り込みデータの香典帳が違えば、どちらにも書き込まない", async () => {
		const i = ids();
		const other = ids();
		await importAll(i);
		const res = await call(`/internal/import/koudens/${other.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: koudenPayload(i, future()),
		});
		expect(res.status).toBe(400);
		expect(await res.json()).toMatchObject({ error: "kouden_id_mismatch" });
		const row = await env.DB.prepare("SELECT count(*) AS n FROM koudens WHERE id = ?")
			.bind(other.kouden)
			.first();
		expect(row).toEqual({ n: 0 });
	});

	it("削除した香典帳（リハーサルの後片付けなど）にも、同じ ID で取り込み直せる", async () => {
		const i = ids();
		await importAll(i);
		// 前の台帳で編集が進んでいた（変更ログの seq が大きい）投影を残しておく
		await env.DB.prepare(
			"UPDATE kouden_stats SET gift_count = 99, total_amount = 999999, projected_seq = 500 WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.run();
		await ledgerFor(env, i.kouden).deleteAll();
		const { ledger } = await importAll(i);
		// 作り直した台帳の変更ログは 1 から数え直すが、統計は取り込んだ台帳のものになる
		const stats = await env.DB.prepare(
			"SELECT gift_count, total_amount FROM kouden_stats WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.first();
		expect(stats).toEqual({ gift_count: 3, total_amount: 10000 });
		expect(ledger).toMatchObject({ persons: 2, gifts: { koden: 1 }, reminders: 2 });
		const owner = makeApp({
			sub: i.sub,
			email: `${i.owner}@gmail.com`,
			emailVerified: true,
			name: "x",
		});
		await owner.login();
		expect(await (await owner.request(`/k/${i.kouden}/persons`)).text()).toContain("佐藤 一郎");
	});

	it("D1 の 1 回の実行あたりの文の上限を超える人数は、書き込む前に断る", async () => {
		const i = ids();
		const [owner] = users(i);
		if (!owner) throw new Error("no user");
		const many = Array.from({ length: IMPORT_USERS_PER_REQUEST + 1 }, (_, n) => ({
			...owner,
			id: `${i.owner}-${n}`,
			legacyUserId: `${i.owner}-${n}-legacy`,
			googleSub: null,
		}));
		const res = await call("/internal/import/users", {
			method: "POST",
			headers: TOKEN,
			json: { users: many },
		});
		expect(res.status).toBe(400);
		const ok = await call("/internal/import/users", {
			method: "POST",
			headers: TOKEN,
			json: { users: many.slice(0, IMPORT_USERS_PER_REQUEST) },
		});
		expect(ok.status).toBe(200);
		const row = await env.DB.prepare("SELECT count(*) AS n FROM users WHERE id LIKE ?")
			.bind(`${i.owner}-%`)
			.first();
		expect(row).toEqual({ n: IMPORT_USERS_PER_REQUEST });
	});

	it("台帳を入れ替えた後に統計の投影（D1）が失敗しても取り込みは成功とし、アラームで前の投影を上書きする", async () => {
		const i = ids();
		await importAll(i);
		// 前の台帳の投影（seq が大きい）を残しておく
		await env.DB.prepare(
			"UPDATE kouden_stats SET gift_count = 99, total_amount = 999999, projected_seq = 500 WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.run();
		const { ledger } = koudenPayload(i, future());
		await runInDurableObject(ledgerFor(env, i.kouden), async (instance, state) => {
			const target = instance as unknown as { env: Env; alarm(): Promise<void> };
			const original = target.env;
			// 投影の書き込みだけ一時的に失敗させる
			target.env = {
				...original,
				DB: new Proxy(original.DB, {
					get(db, key) {
						if (key !== "prepare") return Reflect.get(db, key, db);
						return (sql: string) => {
							if (sql.includes("kouden_stats")) throw new Error("D1 is temporarily unavailable");
							return db.prepare(sql);
						};
					},
				}),
			};
			const summary = await instance.importSnapshot(i.kouden, ledger, new Date().toISOString());
			expect(summary).toMatchObject({ persons: 2, gifts: { koden: 1 } });
			expect(await state.storage.getAlarm()).not.toBeNull();
			target.env = original;
			await target.alarm();
		});
		const stats = await env.DB.prepare(
			"SELECT gift_count, total_amount FROM kouden_stats WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.first();
		expect(stats).toEqual({ gift_count: 3, total_amount: 10000 });
	});

	it("削除した香典帳への取り込みに失敗したら、削除済みのまま（空の台帳を開けるようにしない）", async () => {
		const i = ids();
		await importAll(i);
		await ledgerFor(env, i.kouden).deleteAll();
		const payload = koudenPayload(i, future());
		payload.ledger.contributors.push({
			giftId: i.g1,
			personId: "missing",
			isPrimary: false,
			shareAmount: null,
		});
		const res = await call(`/internal/import/koudens/${i.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: payload,
		});
		expect(res.status).toBe(500);
		const deletedAt = await runInDurableObject(ledgerFor(env, i.kouden), (_obj, state) =>
			state.storage.sql
				.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'deleted_at'")
				.toArray(),
		);
		expect(deletedAt).toHaveLength(1);
		// 直したデータなら取り込み直せる
		const { ledger } = await importAll(i);
		expect(ledger).toMatchObject({ persons: 2, gifts: { koden: 1 } });
	});

	it("一覧の「最近の動き」は旧アプリで最後に動いた時刻にする（取り込んだ時刻にしない）", async () => {
		const i = ids();
		const payload = koudenPayload(i, future());
		const [koden] = payload.ledger.gifts;
		if (koden) koden.updatedAt = "2024-03-09T10:00:00.000Z";
		await importAll(i, payload);
		const row = await env.DB.prepare(
			`SELECT k.updated_at, s.last_activity_at FROM koudens k
       JOIN kouden_stats s ON s.kouden_id = k.id WHERE k.id = ?`,
		)
			.bind(i.kouden)
			.first();
		expect(row).toEqual({
			updated_at: "2024-03-02T00:00:00.000Z",
			last_activity_at: "2024-03-09T10:00:00.000Z",
		});
	});

	it("台帳を入れ替えた後のアラームの予約・読み直しに失敗しても、取り込みは成功とし D1 の行を戻さない", async () => {
		const i = ids();
		await importAll(i);
		const stub = ledgerFor(env, i.kouden);
		const restore = await runInDurableObject(stub, (instance) => {
			const target = instance as unknown as {
				scheduleAlarm: (soon: boolean) => Promise<void>;
				importSummary: () => Promise<unknown>;
			};
			const { scheduleAlarm, importSummary } = target;
			target.scheduleAlarm = () => Promise.reject(new Error("alarm storage is unavailable"));
			target.importSummary = () => Promise.reject(new Error("storage is unavailable"));
			return () => {
				target.scheduleAlarm = scheduleAlarm;
				target.importSummary = importSummary;
			};
		});
		try {
			const payload = koudenPayload(i, future());
			payload.kouden.title = "変えた名前";
			const res = await call(`/internal/import/koudens/${i.kouden}`, {
				method: "PUT",
				headers: TOKEN,
				json: payload,
			});
			expect(res.status).toBe(200);
			// 件数は入れ替えと同じトランザクションの中で数えたもの
			expect(await res.json()).toMatchObject({ ledger: { persons: 2, gifts: { koden: 1 } } });
			const row = await env.DB.prepare("SELECT title FROM koudens WHERE id = ?")
				.bind(i.kouden)
				.first();
			expect(row).toEqual({ title: "変えた名前" });
		} finally {
			await runInDurableObject(stub, () => restore());
		}
	});

	it("形の合わないデータは受け付けない（香典に金額がない）", async () => {
		const i = ids();
		const payload = koudenPayload(i, future());
		const [koden] = payload.ledger.gifts;
		if (koden) koden.amount = null;
		const res = await call(`/internal/import/koudens/${i.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: payload,
		});
		expect(res.status).toBe(400);
	});

	it("参照の壊れたデータは台帳に入れず、前回の取り込み結果を残す", async () => {
		const i = ids();
		await importAll(i);
		const payload = koudenPayload(i, future());
		// D1 側の変更（名前・メンバー）も、台帳の取り込みに失敗したら戻す
		payload.kouden.title = "変えた名前";
		payload.members = payload.members.filter((m) => m.role === "owner");
		payload.ledger.contributors.push({
			giftId: i.g1,
			personId: "missing",
			isPrimary: false,
			shareAmount: null,
		});
		const res = await call(`/internal/import/koudens/${i.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: payload,
		});
		expect(res.status).toBe(500);
		expect(await res.json()).toMatchObject({
			error: "ledger_import_failed",
			message: expect.stringContaining("FOREIGN KEY"),
		});
		const check = await call(`/internal/import/koudens/${i.kouden}`, { headers: TOKEN });
		const state = await check.json();
		expect(state).toMatchObject({
			ledger: { persons: 2, gifts: { koden: 1 } },
			d1: { members: { owner: 1, editor: 1 }, paidPurchases: 1 },
		});
		// 一覧の統計も前回の取り込み結果のまま
		const stats = await env.DB.prepare(
			"SELECT gift_count, total_amount FROM kouden_stats WHERE kouden_id = ?",
		)
			.bind(i.kouden)
			.first();
		expect(stats).toEqual({ gift_count: 3, total_amount: 10000 });
		const row = await env.DB.prepare("SELECT title FROM koudens WHERE id = ?")
			.bind(i.kouden)
			.first();
		expect(row).toEqual({ title: koudenPayload(i, future()).kouden.title });
	});

	it("初めての取り込みで台帳に失敗したら、D1 に香典帳を残さない", async () => {
		const i = ids();
		await call("/internal/import/users", {
			method: "POST",
			headers: TOKEN,
			json: { users: users(i) },
		});
		const payload = koudenPayload(i, future());
		payload.ledger.contributors.push({
			giftId: i.g1,
			personId: "missing",
			isPrimary: false,
			shareAmount: null,
		});
		const res = await call(`/internal/import/koudens/${i.kouden}`, {
			method: "PUT",
			headers: TOKEN,
			json: payload,
		});
		expect(res.status).toBe(500);
		const rows = await env.DB.batch([
			env.DB.prepare("SELECT count(*) AS n FROM koudens WHERE id = ?").bind(i.kouden),
			env.DB.prepare("SELECT count(*) AS n FROM kouden_members WHERE kouden_id = ?").bind(i.kouden),
			env.DB.prepare("SELECT count(*) AS n FROM purchases WHERE kouden_id = ?").bind(i.kouden),
		]);
		expect(rows.map((r) => r.results[0])).toEqual([{ n: 0 }, { n: 0 }, { n: 0 }]);
	});
});
