import {
	eventSchema,
	receptionSchema,
	returnItemSchema,
	returnRuleSchema,
	returnSchema,
	uuidv7,
} from "@kouden/domain";
import { env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ledgerFor } from "../src/ledger/client.ts";
import type { Mail } from "../src/lib/mailer.ts";
import type { Caller, LedgerResult } from "../src/ledger/types.ts";

function setup(overrides: Partial<Caller> = {}) {
	const caller: Caller = {
		koudenId: uuidv7(),
		userId: "user-1",
		displayName: "山田 花子",
		role: "owner",
		plan: "paid",
		...overrides,
	};
	return { caller, ledger: ledgerFor(env, caller.koudenId) };
}

function unwrap<T>(result: LedgerResult<T>): T {
	if (!result.ok) throw new Error(`ledger error: ${JSON.stringify(result.error)}`);
	return result.value;
}

const item = (name: string, price: string) => returnItemSchema.parse({ name, price });

async function withGifts() {
	const ctx = setup();
	const [wake] = unwrap(await ctx.ledger.listEvents(ctx.caller));
	const give = async (name: string, amount: string) =>
		unwrap(
			await ctx.ledger.createAtReception(
				ctx.caller,
				receptionSchema.parse({ eventId: wake!.id, kind: "koden", name, amount }),
			),
		).personId;
	const taro = await give("山田 太郎", "10000");
	const jiro = await give("佐藤 次郎", "5000");
	return { ...ctx, taro, jiro, eventId: wake!.id };
}

describe("香典返し（DO）", () => {
	it("カタログ: 登録・並べ替え・無効化。使用中の品は削除できない", async () => {
		const { caller, ledger } = setup();
		const tea = unwrap(await ledger.createReturnItem(caller, item("お茶", "3000"), null));
		const towel = unwrap(await ledger.createReturnItem(caller, item("タオル", "5000"), null));
		unwrap(await ledger.moveReturnItem(caller, towel.id, "up"));
		expect(unwrap(await ledger.listReturnItems(caller)).map((i) => i.name)).toEqual([
			"タオル",
			"お茶",
		]);
		unwrap(await ledger.setReturnItemActive(caller, tea.id, false));
		expect(
			unwrap(await ledger.listReturnItems(caller)).find((i) => i.id === tea.id)?.isActive,
		).toBe(false);

		unwrap(
			await ledger.createReturnRule(
				caller,
				returnRuleSchema.parse({ minAmount: "0", ratio: "1/2", suggestedItemId: towel.id }),
			),
		);
		const del = await ledger.deleteReturnItem(caller, towel.id);
		expect(del).toMatchObject({ ok: false, error: { code: "invalid" } });
		// 無効な品は推奨品に選べない
		const bad = await ledger.createReturnRule(
			caller,
			returnRuleSchema.parse({ minAmount: "0", ratio: "1/2", suggestedItemId: tea.id }),
		);
		expect(bad).toMatchObject({ ok: false, error: { code: "invalid", field: "suggestedItemId" } });
		expect(unwrap(await ledger.deleteReturnItem(caller, tea.id))).toEqual({ imageKey: null });
	});

	it("画像を差し替えると、使わなくなった画像のキーを返す", async () => {
		const { caller, ledger } = setup();
		const created = unwrap(await ledger.createReturnItem(caller, item("お茶", "3000"), "key-1"));
		const changed = unwrap(
			await ledger.updateReturnItem(caller, created.id, 1, item("お茶", "3500"), "key-2"),
		);
		expect(changed).toEqual({ removedImageKey: "key-1" });
		const kept = unwrap(
			await ledger.updateReturnItem(caller, created.id, 2, item("お茶", "3500"), undefined),
		);
		expect(kept).toEqual({ removedImageKey: null });
		const stale = await ledger.updateReturnItem(caller, created.id, 2, item("x", "1"), undefined);
		expect(stale).toMatchObject({ ok: false, error: { code: "conflict" } });
	});

	it("一括確定: 品名・単価を写して作り、作成済みの差出人は飛ばす", async () => {
		const { caller, ledger, taro, jiro } = await withGifts();
		const towel = unwrap(await ledger.createReturnItem(caller, item("タオル", "5000"), null));
		const result = unwrap(
			await ledger.confirmReturns(caller, [
				{ personId: taro, itemId: towel.id, onDayAmount: 0 },
				{ personId: jiro, itemId: null, onDayAmount: 2000 },
			]),
		);
		expect(result).toEqual({ created: 2, skipped: 0 });

		// カタログの価格を変えても、明細は確定時の値のまま
		unwrap(await ledger.updateReturnItem(caller, towel.id, 1, item("タオル", "6000"), undefined));
		const board = unwrap(await ledger.returnsBoard(caller));
		const taroRow = board.rows.find((r) => r.person.id === taro);
		expect(taroRow?.person.kodenTotal).toBe(10000);
		expect(taroRow?.ret).toMatchObject({ status: "pending", linesTotal: 5000 });
		expect(taroRow?.ret?.lines).toEqual([
			expect.objectContaining({ name: "タオル", unitPrice: 5000, quantity: 1 }),
		]);
		// 品がなく当日返しを渡していれば、当日返し済み
		expect(board.rows.find((r) => r.person.id === jiro)?.ret).toMatchObject({
			status: "handed_on_day",
			method: "on_day",
			onDayAmount: 2000,
		});

		const again = await ledger.confirmReturns(caller, [
			{ personId: taro, itemId: towel.id, onDayAmount: 0 },
		]);
		expect(again).toMatchObject({ ok: false, error: { code: "invalid" } });
	});

	it("状況の変更: 手配済み・発送済みにすると日付が入り、明細の追加・削除で version が進む", async () => {
		const { caller, ledger, taro } = await withGifts();
		const { id } = unwrap(await ledger.createReturn(caller, taro));
		const v2 = unwrap(
			await ledger.updateReturn(caller, id, 1, returnSchema.parse({ status: "arranged" })),
		);
		const detail = unwrap(await ledger.getReturn(caller, id));
		expect(detail.arrangedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(detail.person.name).toBe("山田 太郎");

		const v3 = unwrap(
			await ledger.addReturnLine(caller, id, v2.version, {
				type: "custom",
				name: "お礼状",
				unitPrice: 100,
				quantity: 2,
			}),
		);
		const lineId = unwrap(await ledger.getReturn(caller, id)).lines[0]!.id;
		expect(unwrap(await ledger.getReturn(caller, id)).linesTotal).toBe(200);
		const stale = await ledger.removeReturnLine(caller, id, v2.version, lineId);
		expect(stale).toMatchObject({ ok: false, error: { code: "conflict" } });
		unwrap(await ledger.removeReturnLine(caller, id, v3.version, lineId));

		const history = unwrap(await ledger.history(caller, "return", id));
		expect(history.entries.map((e) => e.op)).toEqual(["update", "update", "update", "create"]);
		expect(unwrap(await ledger.getPerson(caller, taro)).ret).toMatchObject({
			id,
			status: "arranged",
		});
	});

	it("閲覧者は香典返しを作れない", async () => {
		const { caller, ledger, taro } = await withGifts();
		const viewer = { ...caller, userId: "user-2", role: "viewer" as const };
		const r = await ledger.confirmReturns(viewer, [
			{ personId: taro, itemId: null, onDayAmount: 0 },
		]);
		expect(r).toMatchObject({ ok: false, error: { code: "forbidden" } });
	});
});

async function seedD1(koudenId: string, members: { id: string; role: string; notify?: number }[]) {
	const now = new Date().toISOString();
	const stmts = members.map((m) =>
		env.DB.prepare(
			"INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		).bind(m.id, `${m.id}@example.com`, `${m.id} さん`, now, now),
	);
	stmts.push(
		env.DB.prepare(
			"INSERT INTO koudens (id, title, deceased_name, owner_user_id, created_at, updated_at) VALUES (?, '故 山田 一郎 様', '山田 一郎', ?, ?, ?)",
		).bind(koudenId, members[0]!.id, now, now),
	);
	for (const m of members) {
		stmts.push(
			env.DB.prepare(
				"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at, notify_reminders) VALUES (?, ?, ?, ?, ?)",
			).bind(koudenId, m.id, m.role, now, m.notify ?? 0),
		);
	}
	await env.DB.batch(stmts);
}

/** 四十九日を 30 日後に追加し、お知らせの予定を返す */
async function addMemorial(ctx: Awaited<ReturnType<typeof withGifts>>) {
	const date = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
	const { id } = unwrap(
		await ctx.ledger.createEvent(ctx.caller, eventSchema.parse({ kind: "memorial_49", date })),
	);
	return { id, date };
}

const reminders = (ledger: ReturnType<typeof setup>["ledger"]) =>
	runInDurableObject(ledger, (_obj, state) =>
		state.storage.sql
			.exec<{ kind: string; fire_at: string; sent_at: string | null }>(
				"SELECT kind, fire_at, sent_at FROM reminders ORDER BY fire_at",
			)
			.toArray(),
	);

describe("期限のお知らせ（E6-5）", () => {
	it("四十九日の日付から 14 日前・3 日前のお知らせを作り、日付を変えると作り直す", async () => {
		const ctx = await withGifts();
		const { id, date } = await addMemorial(ctx);
		const list = await reminders(ctx.ledger);
		expect(list.map((r) => r.kind)).toEqual(["return_due_14d", "return_due_3d"]);
		expect(list[1]?.fire_at.slice(0, 10)).toBe(
			new Date(Date.parse(`${date}T00:00:00Z`) - 3 * 86_400_000).toISOString().slice(0, 10),
		);
		// アラームは次のお知らせより早い（書き込み直後の投影）
		const alarm = await runInDurableObject(ctx.ledger, (_obj, state) => state.storage.getAlarm());
		expect(alarm).not.toBeNull();

		unwrap(
			await ctx.ledger.updateEvent(ctx.caller, id, 1, eventSchema.parse({ kind: "funeral", date })),
		);
		expect(await reminders(ctx.ledger)).toEqual([]);
	});

	it("期限が来たら、オーナーと希望した編集者に未対応の件数を知らせる", async () => {
		const ctx = await withGifts();
		await seedD1(ctx.caller.koudenId, [
			{ id: "owner-1", role: "owner" },
			{ id: "editor-on", role: "editor", notify: 1 },
			{ id: "editor-off", role: "editor" },
			{ id: "viewer-1", role: "viewer", notify: 1 },
		]);
		await addMemorial(ctx);
		// 14 日前のお知らせの時刻が来たことにする
		const sent: Mail[] = [];
		await runInDurableObject(ctx.ledger, (obj, state) => {
			obj.mailer = { send: async (mail) => void sent.push(mail) };
			state.storage.sql.exec(
				"UPDATE reminders SET fire_at = ? WHERE kind = 'return_due_14d'",
				new Date(Date.now() - 1000).toISOString(),
			);
		});
		expect(await runDurableObjectAlarm(ctx.ledger)).toBe(true);
		expect(sent.map((m) => m.to).toSorted()).toEqual([
			"editor-on@example.com",
			"owner-1@example.com",
		]);
		expect(sent[0]?.subject).toContain("あと 14 日");
		expect(sent[0]?.text).toContain("まだ対応していない香典返しが 2 件あります");
		expect(sent[0]?.text).toContain(`/k/${ctx.caller.koudenId}/returns`);
		const list = await reminders(ctx.ledger);
		expect(list.find((r) => r.kind === "return_due_14d")?.sent_at).not.toBeNull();
		expect(list.find((r) => r.kind === "return_due_3d")?.sent_at).toBeNull();
		// 次のお知らせ（3 日前）にアラームを予約し直す
		const alarm = await runInDurableObject(ctx.ledger, (_obj, state) => state.storage.getAlarm());
		expect(alarm).toBe(Date.parse(list.find((r) => r.kind === "return_due_3d")!.fire_at));
		const stats = await env.DB.prepare(
			"SELECT return_pending FROM kouden_stats WHERE kouden_id = ?",
		)
			.bind(ctx.caller.koudenId)
			.first();
		expect(stats).toEqual({ return_pending: 2 });
	});

	it("未対応が 0 件なら送らずに送信済みにし、全員への送信に失敗したら再試行させる", async () => {
		const ctx = await withGifts();
		await seedD1(ctx.caller.koudenId, [{ id: "owner-1", role: "owner" }]);
		await addMemorial(ctx);
		const due = async () =>
			runInDurableObject(ctx.ledger, (_obj, state) => {
				state.storage.sql.exec(
					"UPDATE reminders SET fire_at = ?, sent_at = NULL WHERE kind = 'return_due_14d'",
					new Date(Date.now() - 1000).toISOString(),
				);
			});

		await due();
		await runInDurableObject(ctx.ledger, (obj) => {
			obj.mailer = {
				send: async () => {
					throw new Error("smtp down");
				},
			};
		});
		await expect(runDurableObjectAlarm(ctx.ledger)).rejects.toThrow("reminder mail failed");
		expect(
			(await reminders(ctx.ledger)).find((r) => r.kind === "return_due_14d")?.sent_at,
		).toBeNull();

		unwrap(
			await ctx.ledger.confirmReturns(ctx.caller, [
				{ personId: ctx.taro, itemId: null, onDayAmount: 0 },
				{ personId: ctx.jiro, itemId: null, onDayAmount: 0 },
			]),
		);
		for (const r of unwrap(await ctx.ledger.returnsBoard(ctx.caller)).rows) {
			unwrap(
				await ctx.ledger.updateReturn(
					ctx.caller,
					r.ret!.id,
					r.ret!.version,
					returnSchema.parse({ status: "not_required" }),
				),
			);
		}
		await due();
		const sent: Mail[] = [];
		await runInDurableObject(ctx.ledger, (obj) => {
			obj.mailer = { send: async (mail) => void sent.push(mail) };
		});
		await runDurableObjectAlarm(ctx.ledger);
		expect(sent).toEqual([]);
		expect(
			(await reminders(ctx.ledger)).find((r) => r.kind === "return_due_14d")?.sent_at,
		).not.toBeNull();
	});
});
