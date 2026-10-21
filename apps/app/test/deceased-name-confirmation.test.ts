import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { confirmDeceasedName, loadKouden } from "../src/kouden/store.ts";
import { importKoudenRows, koudenRowsBefore, restoreKoudenRows } from "../src/migration/store.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

const AT = new Date("2026-10-13T08:00:00.000Z");
const NOTICE = "故人のお名前をご確認ください";
const INPUT = { deceasedName: "山田 一郎", title: "一郎の香典帳" };

/** オーナーと香典帳を作る。imported が true なら実際の取り込み処理で未確認の移行台帳にする */
async function setup(imported = true, deceasedName = "仮のお名前") {
	const owner = makeApp(TARO, () => AT);
	await owner.login();
	const created = await owner.request("/k", formPost({ deceasedName, title: "旧台帳の名前" }));
	const base = created.headers.get("location") ?? "";
	const id = base.split("/").pop() ?? "";
	const ownerId = await env.DB.prepare("SELECT owner_user_id FROM koudens WHERE id = ?")
		.bind(id)
		.first<string>("owner_user_id");
	if (!ownerId) throw new Error("owner not found");
	const payload = {
		kouden: {
			legacyKoudenId: `legacy-${id}`,
			title: "旧台帳の名前",
			deceasedName,
			ownerUserId: ownerId,
			status: "active" as const,
			createdAt: AT.toISOString(),
			updatedAt: AT.toISOString(),
		},
		members: [
			{ userId: ownerId, role: "owner" as const, joinedAt: AT.toISOString(), invitedBy: null },
		],
		purchases: [],
	};
	if (imported) await importKoudenRows(env.DB, id, payload);
	/** 操作後の D1 を読み直し、名前・確認日時を含む保存状態を検証する */
	const row = () => env.DB.prepare("SELECT * FROM koudens WHERE id = ?").bind(id).first();
	/** ログイン済みオーナーとして確認フォームを送信し、認可と入力検証を通す */
	const confirm = (values = INPUT) =>
		owner.request(`${base}/settings/confirm-deceased-name`, formPost(values));
	return { owner, ownerId, id, base, payload, row, confirm };
}

/** 別の利用者を指定ロールで参加させ、オーナー以外の操作と権限移譲を検証できるようにする */
async function addOther(id: string, role: "editor" | "viewer") {
	const member = makeApp(HANAKO, () => AT);
	await member.login();
	const userId = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?")
		.bind(HANAKO.sub)
		.first<string>("id");
	if (!userId) throw new Error("member not found");
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
	)
		.bind(id, userId, role, AT.toISOString())
		.run();
	return { member, userId };
}

describe("移行した故人名の確認", () => {
	it("未確認のオーナーには各画面で案内し、閲覧だけでは確認済みにならない", async () => {
		const { owner, base, row } = await setup();
		for (const path of ["", "/gifts", "/settings"]) {
			const page = await (await owner.request(`${base}${path}`)).text();
			expect(page).toContain(NOTICE);
			expect(page).toContain(`href="${base}/settings#info"`);
		}
		expect(await row()).toMatchObject({ deceased_name_confirmed_at: null });
	});

	it("新しく作成した香典帳には案内せず、確認 API を送っても変更しない", async () => {
		const { owner, base, row, confirm } = await setup(false);
		expect(await (await owner.request(base)).text()).not.toContain(NOTICE);
		const before = await row();
		expect((await confirm()).status).toBe(303);
		expect(await row()).toEqual(before);
	});

	it("修正した名前と確認日時を保存し、再訪時も案内を表示しない", async () => {
		const { owner, base, row, confirm } = await setup();
		const response = await confirm({ ...INPUT, deceasedName: "　山田 一郎　" });
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe(
			`${base}/settings?notice=deceased_name_confirmed#info`,
		);
		expect(await row()).toMatchObject({
			deceased_name: INPUT.deceasedName,
			title: INPUT.title,
			deceased_name_confirmed_at: AT.toISOString(),
			updated_at: AT.toISOString(),
		});
		const settings = await (await owner.request(response.headers.get("location") ?? "")).text();
		expect(settings).toContain("故人のお名前を確認しました。");
		expect(settings).not.toContain("確認して保存する");
		for (const path of ["", "/gifts", "/settings"]) {
			expect(await (await owner.request(`${base}${path}`)).text()).not.toContain(NOTICE);
		}
	});

	it("仮設定の名前が正しければ、そのまま確認できる。再送で古い名前に戻さない", async () => {
		const { confirm, row } = await setup(true, INPUT.deceasedName);
		expect((await confirm()).status).toBe(303);
		const before = await row();
		expect((await confirm({ deceasedName: "古いタブの名前", title: "古い台帳名" })).status).toBe(
			303,
		);
		expect(await row()).toEqual(before);
	});

	it.each(["", "　 ", "（故人名未確認）", "あ".repeat(51)])(
		"不正な故人名では確認済みにならない: %s",
		async (deceasedName) => {
			const { owner, base, row, confirm } = await setup();
			const before = await row();
			const response = await confirm({ deceasedName, title: "入力中の台帳名" });
			expect(response.status).toBe(422);
			const html = await response.text();
			expect(html).toContain('aria-invalid="true"');
			expect(html).toContain('value="入力中の台帳名"');
			expect(html).toContain("確認して保存する");
			expect(await row()).toEqual(before);
			expect(await (await owner.request(base)).text()).toContain(NOTICE);
		},
	);

	it("元台帳名がない場合は、補完値を入力欄に入れず実名の入力を促す", async () => {
		const { owner, base } = await setup(true, "（故人名未確認）");
		const html = await (await owner.request(`${base}/settings`)).text();
		expect(html).toContain('name="deceasedName" type="text" value=""');
		expect(html).toContain("確認して保存する");
	});

	it.each(["editor", "viewer"] as const)(
		"%s は案内・確認ボタンがなく、直接 POST しても変更できない",
		async (role) => {
			const { id, base, row } = await setup();
			const { member } = await addOther(id, role);
			const before = await row();
			const html = await (await member.request(`${base}/settings`)).text();
			expect(html).not.toContain(NOTICE);
			expect(html).not.toContain("確認して保存する");
			expect(
				(await member.request(`${base}/settings/confirm-deceased-name`, formPost(INPUT))).status,
			).toBe(403);
			expect(await row()).toEqual(before);
		},
	);

	it("非メンバーには404、未ログインならログインを要求する", async () => {
		const { base } = await setup();
		const other = makeApp(HANAKO, () => AT);
		const path = `${base}/settings/confirm-deceased-name`;
		expect((await other.request(path, formPost(INPUT))).status).toBe(302);
		await other.login();
		expect((await other.request(path, formPost(INPUT))).status).toBe(404);
	});

	it("アーカイブ中は解除先を案内し、解除するまで確認を保存できない", async () => {
		const { owner, base, confirm, row } = await setup();
		await owner.request(`${base}/archive`, formPost({ archived: "1" }));
		const html = await (await owner.request(base)).text();
		expect(html).toContain("確認するには、アーカイブを解除してください。");
		expect(html).toContain(`href="${base}/settings#archive"`);
		expect((await confirm()).status).toBe(403);
		expect(await row()).toMatchObject({ deceased_name_confirmed_at: null });
		await owner.request(`${base}/archive`, formPost({ archived: "0" }));
		expect((await confirm()).status).toBe(303);
		expect(await row()).toMatchObject({ deceased_name_confirmed_at: AT.toISOString() });
	});

	it("所有者が変わったら新しいオーナーが確認し、古いオーナーの要求はDBでも拒否する", async () => {
		const { ownerId, id, base, confirm, row } = await setup();
		const { member, userId } = await addOther(id, "editor");
		await env.DB.batch([
			env.DB.prepare(
				"UPDATE kouden_members SET role = 'editor' WHERE kouden_id = ? AND user_id = ?",
			).bind(id, ownerId),
			env.DB.prepare(
				"UPDATE kouden_members SET role = 'owner' WHERE kouden_id = ? AND user_id = ?",
			).bind(id, userId),
			env.DB.prepare("UPDATE koudens SET owner_user_id = ? WHERE id = ?").bind(userId, id),
		]);
		expect((await confirm()).status).toBe(403);
		expect(await confirmDeceasedName(env.DB, id, ownerId, INPUT, AT)).toBe(false);
		expect(await (await member.request(base)).text()).toContain(NOTICE);
		expect(
			(await member.request(`${base}/settings/confirm-deceased-name`, formPost(INPUT))).status,
		).toBe(303);
		expect(await row()).toMatchObject({ deceased_name_confirmed_at: AT.toISOString() });
	});

	it("同時に届いた確認は一度だけ保存し、後から届いた入力では上書きしない", async () => {
		const { id, ownerId, row } = await setup();
		const results = await Promise.all([
			confirmDeceasedName(env.DB, id, ownerId, INPUT, AT),
			confirmDeceasedName(
				env.DB,
				id,
				ownerId,
				{ deceasedName: "別のお名前", title: "別の名前" },
				AT,
			),
		]);
		expect(results.filter(Boolean)).toHaveLength(1);
		expect(await row()).toMatchObject({
			deceased_name: results[0] ? INPUT.deceasedName : "別のお名前",
			deceased_name_confirmed_at: AT.toISOString(),
		});
	});

	it("通常の情報更新だけでは確認済みにしない", async () => {
		const { owner, base, row } = await setup();
		expect((await owner.request(`${base}/settings/kouden`, formPost(INPUT))).status).toBe(303);
		expect(await row()).toMatchObject({
			deceased_name: INPUT.deceasedName,
			deceased_name_confirmed_at: null,
		});
		expect(await (await owner.request(base)).text()).toContain(NOTICE);
	});

	it("再取り込みで仮の名前に戻したら未確認にし、取り込み失敗の復元では確認状態も戻す", async () => {
		const { id, ownerId, payload, confirm, row } = await setup();
		await confirm();
		const before = await koudenRowsBefore(env.DB, id);
		await importKoudenRows(env.DB, id, payload);
		expect(await loadKouden(env.DB, id, ownerId)).toMatchObject({
			needsDeceasedNameConfirmation: true,
		});
		expect(await row()).toMatchObject({
			deceased_name: "仮のお名前",
			deceased_name_confirmed_at: null,
		});
		await restoreKoudenRows(env.DB, id, before);
		expect(await row()).toEqual(before.kouden);
		expect(await loadKouden(env.DB, id, ownerId)).toMatchObject({
			needsDeceasedNameConfirmation: false,
		});
	});
});
