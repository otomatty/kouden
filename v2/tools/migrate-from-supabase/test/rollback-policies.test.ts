import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { newId } from "../src/ids.ts";
import { planRollback } from "../src/rollback-plan.ts";
import { rollbackSql } from "../src/rollback-sql.ts";
import {
	at,
	exportedFixture,
	ids,
	legacyDatabase,
	ownershipTransferFixture,
	sourceFixture,
	sourceWithCounts,
} from "./rollback-fixture.ts";

// 最初のWASM初期化はCIで5秒を超えるため、テスト本体のタイムアウトとは分ける。
beforeAll(async () => {
	const db = new PGlite();
	try {
		await db.exec("SELECT 1");
	} finally {
		await db.close();
	}
}, 15000);

const newUser = "v2-user-created-after-cutover";
const newLegacyUser = "10000000-0000-4000-8000-0000000000aa";

/** 切り替え後に v2 で登録したユーザーを、移行済みの冊に閲覧者として招待した状態。 */
function invitedNewUser() {
	const source = sourceFixture();
	source.data["public.kouden_roles"]!.push({
		...source.data["public.kouden_roles"]![0],
		id: "50000000-0000-4000-8000-000000000002",
		name: "viewer",
		permissions: ["view"],
	});
	const counted = sourceWithCounts(source.data);
	const current = exportedFixture(counted);
	current.manifest.users.push({
		id: newUser,
		legacy_user_id: null,
		display_name: "新規利用者",
		created_at: at,
		deleted_at: null,
	});
	current.manifest.members.push({
		kouden_id: current.ledgers[0]!.koudenId,
		user_id: newUser,
		role: "viewer",
		joined_at: at,
		invited_by: current.manifest.users[0]!.id,
	});
	return { source: counted, current };
}

describe("books, users and purchases created after cutover (#186)", () => {
	it("lists a new book and its purchase without blocking or writing them", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		const book = { ...current.manifest.koudens[0]!, id: "v2-new-book", legacy_kouden_id: null };
		current.manifest.koudens.push(book);
		current.manifest.members.push({ ...current.manifest.members[0]!, kouden_id: book.id });
		current.manifest.purchases.push({
			id: "v2-purchase",
			kouden_id: book.id,
			user_id: current.manifest.users[0]!.id,
			amount: 2980,
			source: "stripe",
			status: "paid",
		});
		const tables = current.ledgers[0]!.tables;
		current.ledgers.push({
			...current.ledgers[0]!,
			koudenId: book.id,
			tables: Object.fromEntries(
				Object.keys(tables).map((t) => [t, []]),
			) as unknown as typeof tables,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after).toEqual(plan.before);
		expect(plan.notices).toEqual([
			{ code: "new_book_not_rolled_back", entityId: book.id },
			{
				code: "purchase_not_rolled_back",
				entityId: "v2-purchase",
				koudenId: book.id,
				source: "stripe",
				status: "paid",
				amount: 2980,
			},
		]);
	});
	it("keeps a book deleted in v2 for the legacy deletion procedure and lists its purchase", () => {
		const source = sourceFixture();
		source.data["public.kouden_purchases"] = [
			{
				id: "40000000-0000-4000-8000-000000000002",
				kouden_id: ids.book,
				user_id: ids.user,
				plan_id: ids.plan,
				expected_count: null,
				amount_paid: 2980,
				stripe_session_id: "cs_test",
				purchased_at: at,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const bookId = current.ledgers[0]!.koudenId;
		current.manifest.koudens = [];
		current.manifest.members = [];
		current.ledgers = [];
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after).toEqual(plan.before);
		expect(plan.notices).toEqual([
			{ code: "deleted_book_requires_manual_cleanup", entityId: bookId, legacyKoudenId: ids.book },
			expect.objectContaining({ code: "purchase_not_rolled_back", koudenId: bookId }),
		]);
	});
	it("lists a new user who is not referenced by a migrated book", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.manifest.users.push({
			id: newUser,
			legacy_user_id: null,
			display_name: "新規",
			created_at: at,
			deleted_at: null,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([{ code: "new_user_not_rolled_back", entityId: newUser }]);
	});
	it("requires an explicit Auth ID for a new member and writes it after the Admin API created it", async () => {
		const { source, current } = invitedNewUser();
		expect(planRollback(source, current).blockers).toContainEqual({
			code: "unmapped_user",
			entityId: newUser,
		});
		const map = [{ v2UserId: newUser, legacyUserId: newLegacyUser }];
		const plan = planRollback(source, current, map);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([
			{ code: "new_user_mapped", entityId: newUser, legacyUserId: newLegacyUser },
		]);
		const db = await legacyDatabase(source);
		try {
			// Auth ユーザーを作る前は、旧DBのトリガーが作る profiles の行がなく前提照合で止まる。
			await expect(db.exec(rollbackSql(plan, "apply"))).rejects.toThrow(
				"rollback_precondition_failed:profiles",
			);
			await db.exec("ROLLBACK");
			// Admin API で作成したときに handle_new_user が作る行に相当する。
			await db.query("INSERT INTO profiles(id, display_name) VALUES ($1, 'new@example.test')", [
				newLegacyUser,
			]);
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query(
						"SELECT p.display_name, r.name FROM kouden_members m JOIN profiles p ON p.id = m.user_id JOIN kouden_roles r ON r.id = m.role_id WHERE m.user_id = $1",
						[newLegacyUser],
					)
				).rows,
			).toEqual([{ display_name: "新規利用者", name: "viewer" }]);
		} finally {
			await db.close();
		}
	});
	it.each([
		["an existing legacy Auth user", newUser, ids.user],
		["a migrated v2 user", "migrated", newLegacyUser],
		["an unknown v2 user", "unknown", newLegacyUser],
		["a non-UUID Auth ID", newUser, "not-a-uuid"],
	])("rejects a user map entry for %s", (_, v2UserId, legacyUserId) => {
		const { source, current } = invitedNewUser();
		const v2 = v2UserId === "migrated" ? String(current.manifest.users[0]!.id) : v2UserId;
		expect(() => planRollback(source, current, [{ v2UserId: v2, legacyUserId }])).toThrow(
			"rollback_user_map_invalid",
		);
	});
	it("rejects two v2 users mapped to the same Auth ID", () => {
		const { source, current } = invitedNewUser();
		current.manifest.users.push({ ...current.manifest.users.at(-1)!, id: "another" });
		expect(() =>
			planRollback(source, current, [
				{ v2UserId: newUser, legacyUserId: newLegacyUser },
				{ v2UserId: "another", legacyUserId: newLegacyUser },
			]),
		).toThrow("rollback_user_map_invalid");
	});
});

const entryB = "30000000-0000-4000-8000-000000000002";
const offeringId = "90000000-0000-4000-8000-000000000001";
const returnRow = (entry: string, i: number, total: number) => ({
	id: `70000000-0000-4000-8000-00000000000${i + 1}`,
	kouden_entry_id: entry,
	return_status: "PENDING",
	return_method: null,
	funeral_gift_amount: 0,
	arrangement_date: null,
	shipping_postal_code: null,
	shipping_address: null,
	shipping_phone_number: null,
	remarks: null,
	return_items: [],
	total_amount: total,
	return_items_cost: 0,
	additional_return_amount: total,
	profit_loss: total,
	created_by: ids.user,
	created_at: at,
	updated_at: at,
});

/** 香典 2 件（A: 10,000 円、B: 5,000 円）と返礼記録。供物ありなら A に按分・紐づけ済み。 */
function twoEntries(withOffering: boolean) {
	const source = sourceFixture();
	const entries = source.data["public.kouden_entries"]!;
	entries.push({ ...entries[0]!, id: entryB, name: "二人目", amount: 5000, is_duplicate: false });
	if (withOffering) {
		entries[0]!.has_offering = true;
		source.data["public.offerings"] = [
			{
				id: offeringId,
				kouden_id: ids.book,
				type: "FLOWER",
				description: "供花",
				quantity: 1,
				price: 5000,
				provider_name: "差出人",
				notes: null,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		source.data["public.offering_allocations"] = [
			{
				id: "91000000-0000-4000-8000-000000000001",
				offering_id: offeringId,
				kouden_entry_id: ids.entry,
				allocated_amount: 5000,
				allocation_ratio: 1,
				is_primary_contributor: true,
				contribution_notes: null,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		source.data["public.offering_entries"] = [
			{
				id: "92000000-0000-4000-8000-000000000001",
				offering_id: offeringId,
				kouden_entry_id: ids.entry,
				created_by: ids.user,
				created_at: at,
			},
		];
	}
	source.data["public.return_entry_records"] = [
		returnRow(ids.entry, 0, withOffering ? 15000 : 10000),
		returnRow(entryB, 1, 5000),
	];
	const counted = sourceWithCounts(source.data);
	return { source: counted, current: exportedFixture(counted) };
}

const personOf = (current: ReturnType<typeof exportedFixture>, entry: string) =>
	current.ledgers[0]!.tables.persons.find((p) => p.id === newId.entryPerson(entry))!;

/**
 * aligned が false なら、紐づけの削除で返礼金額を再計算しない構成（20261018 の未適用の本番を想定）。
 * 返礼記録の BEFORE トリガー（fixture の return_total）だけが合計を計算する。
 */
async function withOfferingTriggers(source: ReturnType<typeof sourceWithCounts>, aligned = true) {
	// 元スナップショットの行を入れた後に置き、投入時にトリガーが動かないようにする。
	const db = await legacyDatabase(source);
	for (const sql of [
		new URL("./fixtures/rollback-legacy-offering-triggers.sql", import.meta.url),
		...(aligned
			? [
					new URL(
						"../../../../supabase/migrations/20261018000000_align_return_amount_triggers_with_deployed.sql",
						import.meta.url,
					),
				]
			: []),
	])
		await db.exec(await readFile(sql, "utf8"));
	return db;
}
const state = async (db: PGlite) =>
	(
		await db.query(
			`SELECT e.id::text AS entry, e.has_offering, r.total_amount::int AS total,
				(SELECT count(*)::int FROM offering_entries o WHERE o.kouden_entry_id = e.id) AS links,
				(SELECT json_agg(json_build_object('amount', a.allocated_amount::int, 'ratio', a.allocation_ratio::float, 'primary', a.is_primary_contributor))
				   FROM offering_allocations a WHERE a.kouden_entry_id = e.id) AS allocations
			 FROM kouden_entries e LEFT JOIN return_entry_records r ON r.kouden_entry_id = e.id ORDER BY e.id`,
		)
	).rows;

describe("ledger structures written in the legacy screen's terms (#188)", () => {
	it("deletes the legacy return record so the old screen shows the entry as not handled", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.returns.find((r) => r.person_id === newId.entryPerson(entryB))!.deleted_at = at;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(await db.query("SELECT kouden_entry_id::text AS entry FROM return_entry_records")).rows,
			).toEqual([{ entry: ids.entry }]);
		} finally {
			await db.close();
		}
	});
	it("keeps the legacy record for a return recreated for the same person", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		const removed = t.returns.find((r) => r.person_id === newId.entryPerson(entryB))!;
		removed.deleted_at = at;
		t.returns.push({ ...removed, id: "recreated-return", deleted_at: null, notes: "作り直し" });
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query(
						"SELECT kouden_entry_id::text AS entry, remarks FROM return_entry_records ORDER BY kouden_entry_id",
					)
				).rows,
			).toEqual([
				{ entry: ids.entry, remarks: null },
				{ entry: entryB, remarks: "作り直し" },
			]);
		} finally {
			await db.close();
		}
	});
	it("keeps a deleted return blocked while the legacy completed flag would still show it", () => {
		const { source } = twoEntries(false);
		source.data["public.kouden_entries"]!.find((e) => e.id === entryB)!.is_return_completed = true;
		const current = exportedFixture(source);
		const removed = current.ledgers[0]!.tables.returns.find(
			(r) => r.person_id === newId.entryPerson(entryB),
		)!;
		removed.deleted_at = at;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([
			{ code: "deleted_return_requires_manual_cleanup", entityId: removed.id },
		]);
		expect(plan.after.return_entry_records).toEqual(plan.before.return_entry_records);
	});
	it.each([true, false])(
		"moves an offering share to another koden through allocations, links and legacy triggers (return trigger migration: %s)",
		async (aligned) => {
			const { source, current } = twoEntries(true);
			const t = current.ledgers[0]!.tables;
			const gift = t.gifts.find((g) => g.id === newId.offeringGift(offeringId))!;
			t.gift_contributors = t.gift_contributors.filter((c) => c.gift_id !== gift.id);
			t.gift_contributors.push({
				gift_id: gift.id,
				person_id: personOf(current, entryB).id,
				is_primary: 1,
				share_amount: 5000,
			});
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([]);
			const db = await withOfferingTriggers(source, aligned);
			try {
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				expect(await state(db)).toEqual([
					{ entry: ids.entry, has_offering: false, total: 10000, links: 0, allocations: null },
					{
						entry: entryB,
						has_offering: true,
						total: 10000,
						links: 1,
						allocations: [{ amount: 5000, ratio: 1, primary: true }],
					},
				]);
				await db.exec(rollbackSql(plan, "apply"));
			} finally {
				await db.close();
			}
		},
	);
	it("recalculates the allocation ratio when only the offering amount changes", async () => {
		const { source, current } = twoEntries(true);
		current.ledgers[0]!.tables.gifts.find((g) => g.id === newId.offeringGift(offeringId))!.amount =
			10000;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await withOfferingTriggers(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect((await state(db))[0]).toEqual({
				entry: ids.entry,
				has_offering: true,
				total: 20000,
				links: 1,
				allocations: [{ amount: 5000, ratio: 0.5, primary: true }],
			});
		} finally {
			await db.close();
		}
	});
	it("keeps the note of a removed allocation in the offering's notes", () => {
		const { source } = twoEntries(true);
		source.data["public.offering_allocations"]![0]!.contribution_notes = "花は連名で";
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		const gift = t.gifts.find((g) => g.id === newId.offeringGift(offeringId))!;
		// 移行時に按分の備考を供物の備考に足している。
		expect(gift.notes).toBe("差出人: 花は連名で");
		t.gift_contributors = t.gift_contributors.filter((c) => c.gift_id !== gift.id);
		t.gift_contributors.push({
			gift_id: gift.id,
			person_id: personOf(current, entryB).id,
			is_primary: 1,
			share_amount: 5000,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.offering_allocations.map((a) => a.contribution_notes)).toEqual([null]);
		expect(plan.after.offerings[0]!.notes).toBe("差出人: 花は連名で");
	});
	it("adds only the removed allocation's note to the untouched legacy offering notes", () => {
		const { source: initial } = twoEntries(true);
		const source = sourceWithCounts(structuredClone(initial.data));
		source.data["public.offerings"]![0]!.notes = "  元の備考  ";
		source.data["public.offering_allocations"]![0]!.contribution_notes = "花は連名で";
		source.data["public.offering_allocations"]!.push({
			...source.data["public.offering_allocations"]![0]!,
			id: "91000000-0000-4000-8000-000000000002",
			kouden_entry_id: entryB,
			allocated_amount: 2500,
			allocation_ratio: 0.5,
			is_primary_contributor: false,
			contribution_notes: "Bの備考",
		});
		source.row_counts["public.offering_allocations"] = 2;
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		const gift = t.gifts.find((g) => g.id === newId.offeringGift(offeringId))!;
		expect(gift.notes).toBe("元の備考\n差出人: 花は連名で\n二人目: Bの備考");
		t.gift_contributors = t.gift_contributors.filter(
			(c) => c.gift_id !== gift.id || c.person_id === personOf(current, entryB).id,
		);
		t.gift_contributors.find((c) => c.gift_id === gift.id)!.is_primary = 1;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.offerings[0]!.notes).toBe("  元の備考  \n差出人: 花は連名で");
		expect(plan.after.offering_allocations.map((a) => a.contribution_notes)).toEqual(["Bの備考"]);
	});
	it("adds a new offering shared by two koden senders with ratios of the offering amount", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.gifts.push({
			...t.gifts[0]!,
			id: "new-offering",
			kind: "kyoka",
			amount: 5000,
			quantity: 1,
			item_name: "供花",
			attendance: null,
		});
		for (const [entry, share] of [
			[ids.entry, 3000],
			[entryB, 2000],
		] as const)
			t.gift_contributors.push({
				gift_id: "new-offering",
				person_id: personOf(current, entry).id,
				is_primary: entry === ids.entry ? 1 : 0,
				share_amount: share,
			});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await withOfferingTriggers(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(await state(db)).toEqual([
				{
					entry: ids.entry,
					has_offering: true,
					total: 15000,
					links: 1,
					allocations: [{ amount: 3000, ratio: 0.6, primary: true }],
				},
				{
					entry: entryB,
					has_offering: true,
					total: 10000,
					links: 1,
					allocations: [{ amount: 2000, ratio: 0.4, primary: false }],
				},
			]);
		} finally {
			await db.close();
		}
	});
	it("refuses an offering shared with a sender who has no koden", () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.persons.push({ ...t.persons[0]!, id: "no-koden", name: "香典なし" });
		t.gifts.push({
			...t.gifts[0]!,
			id: "shared",
			kind: "kumotsu",
			amount: 3000,
			quantity: 1,
			attendance: null,
		});
		for (const person of [personOf(current, ids.entry).id, "no-koden"])
			t.gift_contributors.push({
				gift_id: "shared",
				person_id: person,
				is_primary: person === "no-koden" ? 0 : 1,
				share_amount: null,
			});
		expect(planRollback(source, current).blockers).toEqual([
			{ code: "offering_contributor_without_koden", entityId: "shared" },
		]);
	});
	it("writes a joint koden as its representative with the other names in the notes", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.persons.push({ ...t.persons[0]!, id: "joint", name: "佐藤 次郎", address: "別住所" });
		const gift = t.gifts.find((g) => g.id === newId.entryGift(ids.entry))!;
		t.gift_contributors.push({
			gift_id: gift.id,
			person_id: "joint",
			is_primary: 0,
			share_amount: null,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([
			{ code: "joint_koden_flattened", entityId: gift.id, personIds: ["joint"] },
		]);
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query("SELECT name, amount, notes FROM kouden_entries WHERE id = $1", [
						ids.entry,
					])
				).rows,
			).toEqual([{ name: "  差出人  ", amount: 10000, notes: "連名: 佐藤 次郎" }]);
		} finally {
			await db.close();
		}
		// 再移行した備考から再び切り戻しても、同じ行を二重に足さない。
		gift.notes = "連名: 佐藤 次郎";
		expect(
			planRollback(source, current).after.kouden_entries.find((e) => e.id === ids.entry)!.notes,
		).toBe("連名: 佐藤 次郎");
	});
	it("copies the sender to each koden of the same person and keeps the return on the first one", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		const person = personOf(current, ids.entry);
		person.address = "新しい住所";
		t.gifts.push({
			...t.gifts[0]!,
			id: "second-koden",
			amount: 3000,
			created_at: "2024-02-01T00:00:00.000Z",
		});
		t.gift_contributors.push({
			gift_id: "second-koden",
			person_id: person.id,
			is_primary: 1,
			share_amount: null,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([
			{
				code: "person_has_multiple_koden",
				entityId: person.id,
				kodenCount: 2,
				returnEntryId: ids.entry,
			},
		]);
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query(
						"SELECT amount, address, (SELECT count(*)::int FROM return_entry_records r WHERE r.kouden_entry_id = e.id) AS returns FROM kouden_entries e WHERE e.id <> $1 ORDER BY amount",
						[entryB],
					)
				).rows,
			).toEqual([
				{ amount: 3000, address: "新しい住所", returns: 0 },
				{ amount: 10000, address: "新しい住所", returns: 1 },
			]);
		} finally {
			await db.close();
		}
	});
	it("keeps a person without gifts in the export only", () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.persons.push({ ...t.persons[0]!, id: "address-book-only", name_kana: "ジュウショロク" });
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after).toEqual(plan.before);
		expect(plan.notices).toEqual([{ code: "person_without_gift", entityId: "address-book-only" }]);
	});
	it("notes the event of a gift outside the default funeral and leaves events in the export", async () => {
		const { source, current } = twoEntries(false);
		const t = current.ledgers[0]!.tables;
		t.events[0]!.date = "2026-10-01";
		t.events.push({
			id: "memorial",
			kind: "memorial_49",
			name: "四十九日",
			date: null,
			sort_order: 2,
		});
		t.gifts.find((g) => g.id === newId.entryGift(entryB))!.event_id = "memorial";
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([
			{ code: "event_not_rolled_back", entityId: t.events[0]!.id },
			{ code: "event_not_rolled_back", entityId: "memorial" },
		]);
		expect(plan.after.kouden_entries.find((e) => e.id === entryB)!.notes).toBe("行事: 四十九日");
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
		} finally {
			await db.close();
		}
	});
	it("leaves the recommended amounts of an edited rule it cannot write back", () => {
		const source = sourceFixture();
		source.data["public.return_items"] = [
			{
				id: "70000000-0000-4000-8000-000000000010",
				kouden_id: ids.book,
				name: "タオル",
				price: 1000,
				category: null,
				description: null,
				image_url: null,
				recommended_amount_min: 10000,
				recommended_amount_max: 30000,
				is_active: false,
				sort_order: 1,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const rule = current.ledgers[0]!.tables.return_rules[0]!;
		// 無効な品のルールは、移行時に返礼品を指さない。
		expect(rule.suggested_item_id).toBeNull();
		rule.min_amount = 20000;
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([{ code: "return_rule_not_rolled_back", entityId: rule.id }]);
		expect(plan.after.return_items).toEqual(plan.before.return_items);
	});
	it("appends to the untouched legacy notes instead of the trimmed v2 copy", () => {
		const { source } = twoEntries(false);
		source.data["public.kouden_entries"]!.find((e) => e.id === entryB)!.notes = "  旧の備考  ";
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		t.events.push({
			id: "memorial",
			kind: "memorial_49",
			name: "四十九日",
			date: null,
			sort_order: 2,
		});
		t.gifts.find((g) => g.id === newId.entryGift(entryB))!.event_id = "memorial";
		const plan = planRollback(source, current);
		expect(plan.after.kouden_entries.find((e) => e.id === entryB)!.notes).toBe(
			"  旧の備考  \n行事: 四十九日",
		);
	});
	it("writes half-return rules back to the recommended amounts and lists the others", async () => {
		const source = sourceFixture();
		source.data["public.return_items"] = ["タオル", "茶"].map((name, i) => ({
			id: `70000000-0000-4000-8000-00000000001${i}`,
			kouden_id: ids.book,
			name,
			price: 1000,
			category: null,
			description: null,
			image_url: null,
			recommended_amount_min: i === 0 ? 10000 : null,
			recommended_amount_max: i === 0 ? 30000 : null,
			is_active: true,
			sort_order: i + 1,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		}));
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const t = current.ledgers[0]!.tables;
		const [towel, tea] = t.return_items;
		t.return_rules[0]!.min_amount = 20000;
		t.return_rules[0]!.suggested_item_id = tea!.id;
		t.return_rules.push({
			id: "third",
			min_amount: 50000,
			max_amount: null,
			ratio_numerator: 1,
			ratio_denominator: 3,
			suggested_item_id: towel!.id,
			sort_order: 2,
		});
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.notices).toEqual([{ code: "return_rule_not_rolled_back", entityId: "third" }]);
		expect(
			plan.after.return_items.map((r) => [
				r.name,
				r.recommended_amount_min,
				r.recommended_amount_max,
			]),
		).toEqual([
			["タオル", null, null],
			["茶", 20000, 30000],
		]);
		const db = await legacyDatabase(counted);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
		} finally {
			await db.close();
		}
	});
});

const remarksOf = async (db: PGlite) =>
	(
		await db.query(
			"SELECT return_status, return_method, arrangement_date::text, remarks FROM return_entry_records WHERE kouden_entry_id = $1",
			[ids.entry],
		)
	).rows;
describe("values without a legacy column (#189)", () => {
	it.each([
		["on_day", null],
		["hand_delivery", "【v2】当日返し済み"],
	])("writes a return handed on the day as completed (method: %s)", async (method, remarks) => {
		const { source, current } = twoEntries(false);
		const ret = current.ledgers[0]!.tables.returns.find(
			(r) => r.person_id === newId.entryPerson(ids.entry),
		)!;
		ret.status = "handed_on_day";
		ret.method = method;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(await remarksOf(db)).toEqual([
				{ return_status: "COMPLETED", return_method: method, arrangement_date: null, remarks },
			]);
		} finally {
			await db.close();
		}
	});
	it("adds the ship name, shipped date and due date to the remarks once", async () => {
		const { source, current } = twoEntries(false);
		const ret = current.ledgers[0]!.tables.returns.find(
			(r) => r.person_id === newId.entryPerson(ids.entry),
		)!;
		Object.assign(ret, {
			status: "shipped",
			notes: "既存の備考",
			arranged_at: "2026-10-05",
			ship_name: "山田 花子",
			shipped_at: "2026-10-10",
			due_date: "2026-11-01",
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const expected =
			"既存の備考\n【v2】送付先氏名: 山田 花子\n【v2】発送日: 2026-10-10\n【v2】返礼期限: 2026-11-01";
		const db = await legacyDatabase(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(await remarksOf(db)).toEqual([
				{
					return_status: "COMPLETED",
					return_method: null,
					arrangement_date: "2026-10-05",
					remarks: expected,
				},
			]);
		} finally {
			await db.close();
		}
		ret.notes = expected;
		expect(
			planRollback(source, current).after.return_entry_records.find(
				(r) => r.kouden_entry_id === ids.entry,
			)!.remarks,
		).toBe(expected);
	});
	it("does not note the shipped date that the migration derived from the update time", () => {
		const source = twoEntries(false).source;
		source.data["public.return_entry_records"]![0]!.return_status = "COMPLETED";
		const current = exportedFixture(source);
		const ret = current.ledgers[0]!.tables.returns.find(
			(r) => r.person_id === newId.entryPerson(ids.entry),
		)!;
		expect(ret.shipped_at).not.toBeNull();
		ret.notes = "備考だけ変更";
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(
			plan.after.return_entry_records.find((r) => r.kouden_entry_id === ids.entry)!.remarks,
		).toBe("備考だけ変更");
	});
	it("keeps reading kana and the deceased name in the export and lists them", () => {
		const { source, current } = twoEntries(false);
		current.manifest.koudens[0]!.deceased_name = "山田 一郎";
		const person = personOf(current, ids.entry);
		person.name_kana = "サシダシニン";
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after).toEqual(plan.before);
		expect(plan.notices).toEqual([
			{ code: "deceased_name_not_rolled_back", entityId: current.ledgers[0]!.koudenId },
			{ code: "name_kana_not_rolled_back", entityId: person.id },
		]);
	});
});

const nextOwner = "10000000-0000-4000-8000-000000000002";
/** 元オーナーが作った供物と弔電がある冊を、既存メンバーへ譲渡した状態。 */
const otherUser = "10000000-0000-4000-8000-000000000003";
/**
 * 元オーナーが作った供物と弔電がある冊を、既存メンバーへ譲渡した状態。
 * edit で元スナップショットの行（台帳の作成者や行の作成者）を変えてから export を作る。
 */
function transferWithRows(
	formerOwner: "editor" | "viewer" | "removed",
	edit: (data: Record<string, Record<string, unknown>[]>) => void = () => {},
) {
	const source = ownershipTransferFixture("editor").source;
	source.data["auth.users"]!.push({ ...source.data["auth.users"]![0], id: otherUser });
	source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: otherUser });
	source.data["public.offerings"] = [
		{
			id: offeringId,
			kouden_id: ids.book,
			type: "FLOWER",
			description: "供花",
			quantity: 1,
			price: 5000,
			provider_name: "差出人",
			notes: null,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	source.data["public.telegrams"] = [
		{
			id: "93000000-0000-4000-8000-000000000001",
			kouden_id: ids.book,
			kouden_entry_id: null,
			sender_name: "弔電の差出人",
			sender_organization: null,
			sender_position: null,
			message: null,
			notes: null,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	if (formerOwner === "viewer")
		source.data["public.kouden_roles"]!.push({
			...source.data["public.kouden_roles"]![0],
			id: "50000000-0000-4000-8000-000000000002",
			name: "viewer",
			permissions: ["view"],
		});
	edit(source.data);
	const counted = sourceWithCounts(source.data);
	const exported = exportedFixture(counted);
	const members = exported.manifest.members;
	const owner = members.find((m) => m.role === "owner")!;
	const next = members.find((m) => m.user_id === newId.user(nextOwner))!;
	exported.manifest.koudens[0]!.owner_user_id = next.user_id;
	next.role = "owner";
	if (formerOwner === "removed") exported.manifest.members = members.filter((m) => m !== owner);
	else owner.role = formerOwner;
	return { source: counted, current: exported };
}
describe("rows the former owner created after an ownership transfer (#183)", () => {
	it("judges a photo by its parent offering, as the legacy photo policies do", () => {
		const { source, current } = transferWithRows("removed", (data) => {
			for (const table of ["public.offerings", "public.telegrams"])
				for (const row of data[table]!) row.created_by = nextOwner;
			data["public.offering_photos"] = [
				{
					id: "94000000-0000-4000-8000-000000000001",
					offering_id: offeringId,
					storage_key: `${ids.user}/photo.jpg`,
					caption: null,
					created_by: ids.user,
					created_at: at,
					updated_at: at,
				},
			];
		});
		expect(planRollback(source, current).blockers).toEqual([]);
	});
	it("blocks when the book's creator leaves even if the former owner_id stays an editor", () => {
		const { source, current } = transferWithRows("editor", (data) => {
			data["public.koudens"]![0]!.created_by = otherUser;
			data["public.telegrams"]![0]!.created_by = otherUser;
		});
		expect(planRollback(source, current).blockers).toEqual([
			{ code: "former_owner_row_access_requires_mapping", entityId: current.ledgers[0]!.koudenId },
		]);
	});
	it("does not count rows of the new owner who was the book's creator", () => {
		const { source, current } = transferWithRows("removed", (data) => {
			data["public.koudens"]![0]!.created_by = nextOwner;
			for (const table of ["public.offerings", "public.telegrams"])
				for (const row of data[table]!) row.created_by = nextOwner;
		});
		expect(planRollback(source, current).blockers).toEqual([]);
	});
	it.each(["removed", "viewer"] as const)(
		"keeps the transfer blocked when a %s former owner would keep row-level access",
		async (formerOwner) => {
			const { source, current } = transferWithRows(formerOwner);
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([
				{
					code: "former_owner_row_access_requires_mapping",
					entityId: current.ledgers[0]!.koudenId,
				},
			]);
			expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
			// 台帳の owner_id / created_by だけを変えても、行の created_by で元オーナーに権限が残る。
			const db = await legacyDatabase(
				source,
				"rollback-legacy-auth",
				"rollback-legacy-row-owner-rls",
			);
			try {
				await db.query("UPDATE koudens SET owner_id = $1, created_by = $1", [nextOwner]);
				await db.query("DELETE FROM kouden_members WHERE user_id = $1", [ids.user]);
				await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [ids.user]);
				await db.exec("SET ROLE authenticated");
				expect((await db.query("DELETE FROM offerings RETURNING id")).rows).toHaveLength(1);
				expect((await db.query("DELETE FROM telegrams RETURNING id")).rows).toHaveLength(1);
			} finally {
				await db.close();
			}
		},
	);
	it("allows the transfer when the former owner stays an editor with the same access", () => {
		const { source, current } = transferWithRows("editor");
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.koudens[0]).toMatchObject({ owner_id: nextOwner, created_by: nextOwner });
	});
});
