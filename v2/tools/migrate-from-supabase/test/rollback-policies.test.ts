import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { planRollback } from "../src/rollback-plan.ts";
import { rollbackSql } from "../src/rollback-sql.ts";
import {
	at,
	exportedFixture,
	ids,
	legacyDatabase,
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
