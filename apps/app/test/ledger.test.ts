import {
	FREE_GIFT_LIMIT,
	giftEntrySchema,
	type GiftInput,
	personSchema,
	uuidv7,
} from "@kouden/domain";
import { env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { ledgerFor } from "../src/ledger/client.ts";
import type { Caller, LedgerResult } from "../src/ledger/types.ts";

function setup(overrides: Partial<Caller> = {}) {
	const caller: Caller = {
		koudenId: uuidv7(),
		userId: "user-1",
		displayName: "山田 花子",
		role: "owner",
		plan: "free",
		...overrides,
	};
	return { caller, ledger: ledgerFor(env, caller.koudenId) };
}

function unwrap<T>(result: LedgerResult<T>): T {
	if (!result.ok) throw new Error(`ledger error: ${JSON.stringify(result.error)}`);
	return result.value;
}

const entry = (eventId: string, fields: Record<string, string>) =>
	giftEntrySchema.parse({ eventId, kind: "koden", ...fields });

/** 既定の「葬儀」に「通夜」を足して [葬儀, 通夜] を返す（行事が 2 つ要るテスト用） */
async function twoEvents(ledger: ReturnType<typeof setup>["ledger"], caller: Caller) {
	unwrap(await ledger.createEvent(caller, { kind: "wake", name: "通夜", date: null }));
	return unwrap(await ledger.listEvents(caller));
}

describe("KoudenLedger", () => {
	it("初回の呼び出しで既定の行事と関係を用意する", async () => {
		const { caller, ledger } = setup();
		const events = unwrap(await ledger.listEvents(caller));
		expect(events.map((e) => ({ kind: e.kind, name: e.name }))).toEqual([
			{ kind: "funeral", name: "葬儀" },
		]);
		const rels = unwrap(await ledger.listRelationships(caller));
		expect(rels.map((r) => r.name)).toEqual(["親族", "友人", "会社関係", "近所", "その他"]);
		// 2 回目以降は増えない
		expect(unwrap(await ledger.listEvents(caller))).toHaveLength(1);
	});

	it("番号は行事ごとに 1 から連番で、同時に登録しても重複しない", async () => {
		const { caller, ledger } = setup({ plan: "paid" });
		const [funeral, wake] = await twoEvents(ledger, caller);
		const results = await Promise.all(
			Array.from({ length: 10 }, (_, i) =>
				ledger.createGift(caller, entry(wake!.id, { amount: "5000", name: `参列者${i}` })),
			),
		);
		const numbers = results.map((r) => unwrap(r).receiptNo).toSorted((a, b) => a - b);
		expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

		const other = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "3000", name: "別の人" })),
		);
		expect(other.receiptNo).toBe(1);
	});

	it("登録すると差出人・変更ログが作られ、合計に反映される", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const rels = unwrap(await ledger.listRelationships(caller));
		const created = unwrap(
			await ledger.createGift(
				caller,
				entry(funeral!.id, {
					amount: "10000",
					name: "山田 太郎",
					nameKana: "ヤマダ タロウ",
					relationshipId: rels[0]!.id,
				}),
			),
		);
		expect(created.personLabel).toBe("山田 太郎");

		const overview = unwrap(await ledger.overview(caller));
		expect(overview.totals).toEqual({
			giftCount: 1,
			kodenCount: 1,
			kodenTotal: 10000,
			personCount: 1,
		});
		expect(overview.byRelationship).toEqual([
			{ relationshipId: rels[0]!.id, name: "親族", count: 1, kodenTotal: 10000 },
		]);
		expect(overview.recent[0]?.contributors[0]?.name).toBe("山田 太郎");

		const logs = await runInDurableObject(ledger, (_obj, state) =>
			state.storage.sql
				.exec<{ entity: string; op: string; actor_name: string }>(
					"SELECT entity, op, actor_name FROM change_log WHERE actor_user_id = 'user-1' ORDER BY seq",
				)
				.toArray(),
		);
		expect(logs).toEqual([
			{ entity: "person", op: "create", actor_name: "山田 花子" },
			{ entity: "gift", op: "create", actor_name: "山田 花子" },
		]);
	});

	it("既存の差出人を選んで登録できる（名寄せ）", async () => {
		const { caller, ledger } = setup();
		const [funeral, wake] = await twoEvents(ledger, caller);
		const first = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "5000", name: "佐藤 一郎" })),
		);
		const candidates = unwrap(await ledger.listPersons(caller, { q: "さとう", limit: 5 }));
		expect(candidates).toEqual([]);
		const byName = unwrap(await ledger.listPersons(caller, { q: "佐藤", limit: 5 }));
		expect(byName.map((p) => p.id)).toEqual([first.personId]);

		await ledger.createGift(
			caller,
			giftEntrySchema.parse({ eventId: wake!.id, kind: "kyoka", personId: first.personId }),
		);
		const person = unwrap(await ledger.getPerson(caller, first.personId));
		expect(person.giftCount).toBe(2);
		expect(person.kodenTotal).toBe(5000);
		expect(person.gifts.map((g) => g.kind)).toEqual(["koden", "kyoka"]);
	});

	it("カナの表記ゆれ（ひらがな・半角）でも検索できる", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		await ledger.createGift(
			caller,
			entry(funeral!.id, { amount: "5000", name: "鈴木 次郎", nameKana: "スズキ ジロウ" }),
		);
		for (const q of ["すずき", "ｽｽﾞｷ", "スズキジロウ", "鈴木"]) {
			expect(unwrap(await ledger.listPersons(caller, { q }))).toHaveLength(1);
		}
		const gifts = unwrap(await ledger.listGifts(caller, { q: "すずき" }));
		expect(gifts).toHaveLength(1);
	});

	it("いただきものが 100 件を超えても差出人つきで一覧できる", async () => {
		const { caller, ledger } = setup({ plan: "paid" });
		const [funeral] = unwrap(await ledger.listEvents(caller));
		for (let i = 0; i < 101; i++) {
			unwrap(
				await ledger.createGift(caller, entry(funeral!.id, { amount: "1000", name: `差出人${i}` })),
			);
		}
		const gifts = unwrap(await ledger.listGifts(caller, {}));
		expect(gifts).toHaveLength(101);
		expect(gifts.every((g) => g.contributors.length === 1)).toBe(true);
	});

	it("閲覧者は書き込めない", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const viewer = { ...caller, userId: "user-2", role: "viewer" as const };
		const res = await ledger.createGift(viewer, entry(funeral!.id, { amount: "1", name: "x" }));
		expect(res).toEqual({ ok: false, error: { code: "forbidden" } });
		expect(unwrap(await ledger.listGifts(viewer, {}))).toEqual([]);
	});

	it(`無料版は ${FREE_GIFT_LIMIT} 件まで`, async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		for (let i = 0; i < FREE_GIFT_LIMIT; i++) {
			unwrap(
				await ledger.createGift(caller, entry(funeral!.id, { amount: "1000", name: `p${i}` })),
			);
		}
		const over = await ledger.createGift(caller, entry(funeral!.id, { amount: "1000", name: "x" }));
		expect(over).toEqual({ ok: false, error: { code: "limit_reached", limit: FREE_GIFT_LIMIT } });
		// 有料なら登録できる
		const paid = await ledger.createGift(
			{ ...caller, plan: "paid" },
			entry(funeral!.id, { amount: "1000", name: "x" }),
		);
		expect(paid.ok).toBe(true);
	});

	it("楽観ロック: 古い version での更新は conflict になる", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const { giftId } = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "5000", name: "x" })),
		);
		const input: GiftInput = { eventId: funeral!.id, kind: "koden", amount: 10000 } as GiftInput;
		expect(unwrap(await ledger.updateGift(caller, giftId, 1, input))).toEqual({ version: 2 });
		expect(await ledger.updateGift(caller, giftId, 1, { ...input, amount: 3000 })).toEqual({
			ok: false,
			error: { code: "conflict" },
		});
		const gift = unwrap(await ledger.getGift(caller, giftId));
		expect(gift).toMatchObject({ amount: 10000, version: 2 });

		unwrap(await ledger.deleteGift(caller, giftId, 2));
		expect(await ledger.getGift(caller, giftId)).toEqual({
			ok: false,
			error: { code: "not_found" },
		});
	});

	it("行事を移すと、移した先で番号を振り直す", async () => {
		const { caller, ledger } = setup();
		const [funeral, wake] = await twoEvents(ledger, caller);
		await ledger.createGift(caller, entry(funeral!.id, { amount: "1", name: "a" }));
		const { giftId } = unwrap(
			await ledger.createGift(caller, entry(wake!.id, { amount: "1", name: "b" })),
		);
		await ledger.updateGift(caller, giftId, 1, {
			eventId: funeral!.id,
			kind: "koden",
			amount: 1,
		} as GiftInput);
		expect(unwrap(await ledger.getGift(caller, giftId))).toMatchObject({
			eventId: funeral!.id,
			receiptNo: 2,
		});
	});

	it("同じ requestId の登録は 1 回だけ作り、2 回目以降は最初の結果を返す（人ごと）", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const input = entry(funeral!.id, { amount: "5000", name: "佐藤" });
		const first = unwrap(await ledger.createGift(caller, input, "req-1"));
		const again = unwrap(await ledger.createGift(caller, input, "req-1"));
		expect(again).toEqual(first);
		expect(unwrap(await ledger.listGifts(caller, {}))).toHaveLength(1);
		// 別の人の同じ値は別の要求
		const other = unwrap(await ledger.createGift({ ...caller, userId: "user-2" }, input, "req-1"));
		expect(other.receiptNo).toBe(2);
		// requestId がなければ毎回作る
		unwrap(await ledger.createGift(caller, input));
		expect(unwrap(await ledger.listGifts(caller, {}))).toHaveLength(3);
	});

	it("1 日より古い作成の要求は、次の作成のときに消す", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		await ledger.listEvents(caller);
		await runInDurableObject(ledger, (_obj, state) => {
			state.storage.kv.put("create-request:user-1:old", { at: "2000-01-01T00:00:00.000Z" });
		});
		unwrap(await ledger.createGift(caller, entry(funeral!.id, { amount: "1", name: "a" }), "new"));
		const keys = await runInDurableObject(ledger, (_obj, state) =>
			[...state.storage.kv.list({ prefix: "create-request:" })].map(([k]) => k),
		);
		expect(keys).toEqual(["create-request:user-1:new"]);
	});

	it("表の 1 行の保存: 香典が他の人に更新されていたら、差出人も保存しない", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const { giftId, personId } = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "5000", name: "佐藤" })),
		);
		const gift = { eventId: funeral!.id, kind: "koden" } as const;
		unwrap(await ledger.updateGift(caller, giftId, 1, { ...gift, amount: 6000 } as GiftInput));
		const stale = await ledger.updateSheetRow(caller, {
			giftId,
			giftVersion: 1,
			personId,
			personVersion: 1,
			person: personSchema.parse({ name: "佐藤", address: "東京都" }),
			gift: { ...gift, amount: 7000 } as GiftInput,
		});
		expect(stale).toEqual({ ok: false, error: { code: "conflict" } });
		const person = unwrap(await ledger.getPerson(caller, personId));
		expect(person).toMatchObject({ address: null, version: 1 });

		const saved = unwrap(
			await ledger.updateSheetRow(caller, {
				giftId,
				giftVersion: 2,
				personId,
				personVersion: 1,
				person: personSchema.parse({ name: "佐藤", address: "東京都" }),
				gift: { ...gift, amount: 7000 } as GiftInput,
			}),
		);
		expect(saved).toEqual({ giftVersion: 3, personVersion: 2 });
		expect(unwrap(await ledger.getGift(caller, giftId)).amount).toBe(7000);
	});

	it("連名: 差出人の追加・負担額・代表者の変更・削除", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const { giftId, personId: a } = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "10000", name: "A" })),
		);
		let v = unwrap(
			await ledger.addContributor(caller, giftId, 1, {
				person: { type: "new", input: { name: "B", organization: undefined } },
				shareAmount: null,
			}),
		).version;
		const gift = unwrap(await ledger.getGift(caller, giftId));
		const b = gift.contributors.find((c) => c.name === "B")!.personId;
		expect(gift.contributors.map((c) => [c.name, c.isPrimary])).toEqual([
			["A", true],
			["B", false],
		]);
		// 均等割り
		expect(unwrap(await ledger.getPerson(caller, b)).kodenTotal).toBe(5000);

		v = unwrap(
			await ledger.updateContributor(caller, giftId, v, b, {
				shareAmount: 7000,
				makePrimary: true,
			}),
		).version;
		expect(unwrap(await ledger.getPerson(caller, a)).kodenTotal).toBe(3000);
		expect(unwrap(await ledger.getGift(caller, giftId)).contributors[0]?.name).toBe("B");

		// 同じ人は二重に追加できない
		const dup = await ledger.addContributor(caller, giftId, v, {
			person: { type: "existing", personId: a },
			shareAmount: null,
		});
		expect(dup.ok).toBe(false);

		v = unwrap(await ledger.removeContributor(caller, giftId, v, b)).version;
		const after = unwrap(await ledger.getGift(caller, giftId));
		expect(after.contributors.map((c) => [c.name, c.isPrimary])).toEqual([["A", true]]);
		// 最後の 1 人は外せない
		const last = await ledger.removeContributor(caller, giftId, v, a);
		expect(last).toMatchObject({ ok: false, error: { code: "invalid" } });
	});

	it("関係での絞り込みは代表者の関係で行う（関係別の集計と一致させる）", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const [family, friend] = unwrap(await ledger.listRelationships(caller));
		const { giftId } = unwrap(
			await ledger.createGift(
				caller,
				entry(funeral!.id, { amount: "10000", name: "A", relationshipId: family!.id }),
			),
		);
		const b = unwrap(
			await ledger.createGift(
				caller,
				entry(funeral!.id, { amount: "1000", name: "B", relationshipId: friend!.id }),
			),
		);
		unwrap(
			await ledger.addContributor(caller, giftId, 1, {
				person: { type: "existing", personId: b.personId },
				shareAmount: null,
			}),
		);
		const byFriend = unwrap(await ledger.listGifts(caller, { relationshipId: friend!.id }));
		expect(byFriend.map((g) => g.id)).toEqual([b.giftId]);
		const overview = unwrap(await ledger.overview(caller));
		expect(overview.byRelationship.find((r) => r.relationshipId === friend!.id)?.count).toBe(1);
	});

	it("連名の負担額・代表者の変更でも最終更新日時が進む", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const { giftId, personId } = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "1000", name: "A" })),
		);
		const before = unwrap(await ledger.getGift(caller, giftId)).updatedAt;
		await new Promise((r) => setTimeout(r, 5));
		unwrap(
			await ledger.updateContributor({ ...caller, userId: "user-9" }, giftId, 1, personId, {
				shareAmount: 500,
				makePrimary: false,
			}),
		);
		const after = unwrap(await ledger.getGift(caller, giftId)).updatedAt;
		expect(after > before).toBe(true);
	});

	it("連名の負担額の合計は金額を超えられない（金額を下げる場合も）", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const { giftId, personId } = unwrap(
			await ledger.createGift(caller, entry(funeral!.id, { amount: "10000", name: "A" })),
		);
		const over = await ledger.addContributor(caller, giftId, 1, {
			person: { type: "new", input: { name: "B", organization: undefined } },
			shareAmount: 12000,
		});
		expect(over).toMatchObject({ ok: false, error: { code: "invalid", field: "shareAmount" } });

		const v = unwrap(
			await ledger.updateContributor(caller, giftId, 1, personId, {
				shareAmount: 7000,
				makePrimary: false,
			}),
		).version;
		const lowered = await ledger.updateGift(caller, giftId, v, {
			eventId: funeral!.id,
			kind: "koden",
			amount: 5000,
		} as GiftInput);
		expect(lowered).toMatchObject({ ok: false, error: { code: "invalid", field: "amount" } });
		expect(unwrap(await ledger.getGift(caller, giftId)).amount).toBe(10000);
	});

	it("行事: 記録があるものと最後の 1 つは削除できない。並べ替えできる", async () => {
		const { caller, ledger } = setup();
		const [funeral, wake] = await twoEvents(ledger, caller);
		await ledger.createGift(caller, entry(wake!.id, { amount: "1", name: "a" }));
		expect(await ledger.deleteEvent(caller, wake!.id)).toMatchObject({
			ok: false,
			error: { message: "記録がある行事は削除できません" },
		});
		unwrap(await ledger.moveEvent(caller, wake!.id, "up"));
		expect(unwrap(await ledger.listEvents(caller)).map((e) => e.name)).toEqual(["通夜", "葬儀"]);
		unwrap(await ledger.deleteEvent(caller, funeral!.id));
		const { id } = unwrap(
			await ledger.createEvent(caller, {
				kind: "memorial_49",
				name: "四十九日",
				date: "2026-11-20",
			}),
		);
		expect(unwrap(await ledger.listEvents(caller)).map((e) => e.id)).toEqual([wake!.id, id]);
	});

	it("関係: 使用中は削除できず、非表示にはできる", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		const [family] = unwrap(await ledger.listRelationships(caller));
		await ledger.createGift(
			caller,
			entry(funeral!.id, { amount: "1", name: "a", relationshipId: family!.id }),
		);
		expect((await ledger.deleteRelationship(caller, family!.id)).ok).toBe(false);
		unwrap(await ledger.setRelationshipHidden(caller, family!.id, true));
		// 非表示の関係は新しく選べない
		const res = await ledger.createGift(
			caller,
			entry(funeral!.id, { amount: "1", name: "b", relationshipId: family!.id }),
		);
		expect(res).toMatchObject({ ok: false, error: { field: "relationshipId" } });

		const { id } = unwrap(await ledger.createRelationship(caller, { name: "恩師" }));
		unwrap(await ledger.updateRelationship(caller, id, 1, { name: "学校関係" }));
		unwrap(await ledger.deleteRelationship(caller, id));
	});

	it("書き込みの数秒後に D1 の kouden_stats へ要約を投影する", async () => {
		const { caller, ledger } = setup();
		await env.DB.batch([
			env.DB.prepare(
				"INSERT INTO users (id, email, display_name, created_at, updated_at) VALUES ('user-1', 'a@example.com', 'A', '', '')",
			),
			env.DB.prepare(
				"INSERT INTO koudens (id, title, deceased_name, owner_user_id, created_at, updated_at) VALUES (?, 't', 'd', 'user-1', '', '')",
			).bind(caller.koudenId),
		]);
		const [funeral] = unwrap(await ledger.listEvents(caller));
		await ledger.createGift(caller, entry(funeral!.id, { amount: "3000", name: "a" }));
		await ledger.createGift(
			caller,
			giftEntrySchema.parse({ eventId: funeral!.id, kind: "kyoka", name: "b" }),
		);
		expect(await runDurableObjectAlarm(ledger)).toBe(true);
		const stats = await env.DB.prepare("SELECT * FROM kouden_stats WHERE kouden_id = ?")
			.bind(caller.koudenId)
			.first();
		expect(stats).toMatchObject({ gift_count: 2, total_amount: 3000, person_count: 2 });
	});

	it("deleteAll で中身をすべて消し、遅れて届いた要求でも台帳を作り直さない", async () => {
		const { caller, ledger } = setup();
		const [funeral] = unwrap(await ledger.listEvents(caller));
		await ledger.createGift(caller, entry(funeral!.id, { amount: "1", name: "a" }));
		await ledger.deleteAll();
		const tables = () =>
			runInDurableObject(ledger, (_obj, state) =>
				state.storage.sql
					.exec<{ name: string }>(
						"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gifts'",
					)
					.toArray(),
			);
		expect(await tables()).toEqual([]);

		// 削除の直前に権限確認を通った要求が、削除後に届いた場合
		const late = await ledger.createGift(caller, entry(funeral!.id, { amount: "1", name: "b" }));
		expect(late).toEqual({ ok: false, error: { code: "not_found" } });
		expect(await ledger.listEvents(caller)).toEqual({ ok: false, error: { code: "not_found" } });
		expect(await tables()).toEqual([]);
	});
});

async function twoPeople() {
	const ctx = setup({ plan: "paid" });
	const [funeral] = unwrap(await ctx.ledger.listEvents(ctx.caller));
	const give = async (fields: Record<string, string>) =>
		unwrap(await ctx.ledger.createGift(ctx.caller, entry(funeral!.id, fields)));
	return { ...ctx, eventId: funeral!.id, give };
}

describe("差出人の統合（E5-2）", () => {
	it("いただきものを寄せ、空いている欄を埋め、備考はつなげて、まとめた側を消す", async () => {
		const { caller, ledger, give } = await twoPeople();
		const a = await give({ amount: "10000", name: "佐藤 一郎", address: "東京都千代田区1-1" });
		const b = await give({ amount: "5000", name: "佐藤　一郎", nameKana: "さとう いちろう" });
		unwrap(
			await ledger.updatePerson(
				caller,
				a.personId,
				1,
				personSchema.parse({ name: "佐藤 一郎", address: "東京都千代田区1-1", notes: "叔父" }),
			),
		);
		unwrap(
			await ledger.updatePerson(
				caller,
				b.personId,
				1,
				personSchema.parse({
					name: "佐藤　一郎",
					nameKana: "さとう いちろう",
					address: "大阪府大阪市1-1",
					phone: "03-1234-5678",
					notes: "会社の元同僚",
				}),
			),
		);

		const merged = unwrap(await ledger.mergePersons(caller, a.personId, 2, b.personId, 2));
		expect(merged.version).toBe(3);

		const person = unwrap(await ledger.getPerson(caller, a.personId));
		expect(person).toMatchObject({
			name: "佐藤 一郎",
			nameKana: "さとう いちろう",
			// 両方にある欄は、残す側の内容のまま
			address: "東京都千代田区1-1",
			phone: "03-1234-5678",
			notes: "叔父\n会社の元同僚",
			giftCount: 2,
			kodenTotal: 15000,
			version: 3,
		});
		expect(person.gifts.map((g) => g.id).toSorted()).toEqual([a.giftId, b.giftId].toSorted());
		// まとめた側は消え、一覧・検索に出ない
		expect(await ledger.getPerson(caller, b.personId)).toEqual({
			ok: false,
			error: { code: "not_found" },
		});
		const list = unwrap(await ledger.listPersons(caller));
		expect(list.map((p) => p.id)).toEqual([a.personId]);
		expect(unwrap(await ledger.listPersons(caller, { q: "さとう" })).map((p) => p.id)).toEqual([
			a.personId,
		]);
		// 寄せたいただきものの version が進み、開いていた編集画面は conflict になる
		const gift = unwrap(await ledger.getGift(caller, b.giftId));
		expect(gift.version).toBe(2);
		expect(gift.contributors.map((c) => c.personId)).toEqual([a.personId]);
		expect(unwrap(await ledger.overview(caller)).totals.personCount).toBe(1);

		// 履歴: 残す側に「統合」と、まとめた差出人の名前。いただきものに差出人の変更
		const history = unwrap(await ledger.history(caller, "person", a.personId));
		expect(history.entries[0]).toMatchObject({ op: "merge" });
		expect(JSON.parse(history.entries[0]!.diff ?? "{}")).toMatchObject({
			merged_from: [null, "佐藤　一郎"],
			phone: [null, "03-1234-5678"],
		});
		const giftHistory = unwrap(await ledger.history(caller, "gift", b.giftId));
		expect(JSON.parse(giftHistory.entries[0]!.diff ?? "{}")).toEqual({
			contributors: [[b.personId], [a.personId]],
		});
		expect(giftHistory.names[b.personId]).toBe("佐藤　一郎");
	});

	it("同じ連名に 2 人とも入っていれば 1 人にし、負担額を足して、代表者を引き継ぐ", async () => {
		const { caller, ledger, give } = await twoPeople();
		const a = await give({ amount: "1000", name: "A" });
		const b = await give({ amount: "10000", name: "B" });
		// B が代表者の連名に A を加える（負担額 B 6,000・A 4,000）
		let v = unwrap(
			await ledger.addContributor(caller, b.giftId, 1, {
				person: { type: "existing", personId: a.personId },
				shareAmount: 4000,
			}),
		).version;
		v = unwrap(
			await ledger.updateContributor(caller, b.giftId, v, b.personId, {
				shareAmount: 6000,
				makePrimary: false,
			}),
		).version;

		unwrap(await ledger.mergePersons(caller, a.personId, 1, b.personId, 1));
		const gift = unwrap(await ledger.getGift(caller, b.giftId));
		expect(gift.version).toBe(v + 1);
		expect(gift.contributors).toHaveLength(1);
		expect(gift.contributors[0]).toMatchObject({
			personId: a.personId,
			isPrimary: true,
			shareAmount: 10000,
		});
		expect(unwrap(await ledger.getPerson(caller, a.personId)).kodenTotal).toBe(11000);
	});

	it("連名で片方の負担額が未入力なら、まとめた負担額も未入力にする", async () => {
		const { caller, ledger, give } = await twoPeople();
		const a = await give({ amount: "10000", name: "A" });
		const b = await give({ amount: "1000", name: "B" });
		unwrap(
			await ledger.addContributor(caller, a.giftId, 1, {
				person: { type: "existing", personId: b.personId },
				shareAmount: 3000,
			}),
		);
		unwrap(await ledger.mergePersons(caller, a.personId, 1, b.personId, 1));
		const gift = unwrap(await ledger.getGift(caller, a.giftId));
		expect(gift.contributors).toEqual([
			expect.objectContaining({ personId: a.personId, isPrimary: true, shareAmount: null }),
		]);
	});

	it("香典返しは、まとめた側にだけあれば移す。2 人ともあればまとめない", async () => {
		const { caller, ledger, give } = await twoPeople();
		const a = await give({ amount: "10000", name: "A" });
		const b = await give({ amount: "5000", name: "B" });
		const c = await give({ amount: "3000", name: "C" });
		const ret = unwrap(await ledger.createReturn(caller, b.personId));

		unwrap(await ledger.mergePersons(caller, a.personId, 1, b.personId, 1));
		expect(unwrap(await ledger.getPerson(caller, a.personId)).ret?.id).toBe(ret.id);
		expect(unwrap(await ledger.getReturn(caller, ret.id)).person.id).toBe(a.personId);

		unwrap(await ledger.createReturn(caller, c.personId));
		const blocked = await ledger.mergePersons(caller, a.personId, 2, c.personId, 1);
		expect(blocked).toMatchObject({ ok: false, error: { code: "invalid", field: "_form" } });
		// 何も変えない
		expect(unwrap(await ledger.getPerson(caller, c.personId)).giftCount).toBe(1);
		expect(unwrap(await ledger.getPerson(caller, a.personId)).version).toBe(2);
	});

	it("関係は空いていれば引き継ぎ、まとめた側の関係は外す（使用中に数えない）", async () => {
		const { caller, ledger, give } = await twoPeople();
		const rels = unwrap(await ledger.listRelationships(caller));
		const friend = rels.find((r) => r.name === "友人")!;
		const a = await give({ amount: "10000", name: "A" });
		const b = await give({ amount: "5000", name: "B", relationshipId: friend.id });
		unwrap(await ledger.mergePersons(caller, a.personId, 1, b.personId, 1));
		expect(unwrap(await ledger.getPerson(caller, a.personId)).relationshipId).toBe(friend.id);

		// 2 人とも関係があれば残す側の関係のまま。まとめた側の関係は使用中に数えず、削除できる
		const family = rels.find((r) => r.name === "親族")!;
		const neighbor = rels.find((r) => r.name === "近所")!;
		const c = await give({ amount: "1000", name: "C", relationshipId: family.id });
		const d = await give({ amount: "1000", name: "D", relationshipId: neighbor.id });
		unwrap(await ledger.mergePersons(caller, c.personId, 1, d.personId, 1));
		expect(unwrap(await ledger.getPerson(caller, c.personId)).relationshipId).toBe(family.id);
		const after = unwrap(await ledger.listRelationships(caller));
		expect(after.find((r) => r.id === neighbor.id)?.personCount).toBe(0);
		unwrap(await ledger.deleteRelationship(caller, neighbor.id));
	});

	it("開いた後に変わっていたら conflict。同じ差出人どうし・閲覧者はまとめられない", async () => {
		const { caller, ledger, give } = await twoPeople();
		const a = await give({ amount: "10000", name: "A" });
		const b = await give({ amount: "5000", name: "B" });
		expect(await ledger.mergePersons(caller, a.personId, 1, b.personId, 2)).toEqual({
			ok: false,
			error: { code: "conflict" },
		});
		expect(await ledger.mergePersons(caller, a.personId, 1, a.personId, 1)).toMatchObject({
			ok: false,
			error: { code: "invalid" },
		});
		const viewer = { ...caller, userId: "user-2", role: "viewer" as const };
		expect(await ledger.mergePersons(viewer, a.personId, 1, b.personId, 1)).toMatchObject({
			ok: false,
			error: { code: "forbidden" },
		});
		expect(unwrap(await ledger.listPersons(caller))).toHaveLength(2);
	});
});
