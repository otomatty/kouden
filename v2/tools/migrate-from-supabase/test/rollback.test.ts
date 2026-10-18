import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { captureRollback } from "../src/rollback-export.ts";
import { newId } from "../src/ids.ts";
import { prepareSnapshot } from "../src/prepare.ts";
import { planRollback, ROLLBACK_TABLES } from "../src/rollback-plan.ts";
import { checkedPgEnv, rollbackSql } from "../src/rollback-sql.ts";
import {
	at,
	exportedFixture,
	ids,
	memberRoleFixture,
	ownershipTransferFixture,
	relationshipFixture,
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

function sourceWithReturn() {
	const source = sourceFixture();
	source.data["public.return_items"] = [
		{
			id: "70000000-0000-4000-8000-000000000001",
			kouden_id: ids.book,
			name: "タオル",
			price: 1000,
			category: null,
			description: null,
			image_url: null,
			recommended_amount_min: null,
			recommended_amount_max: null,
			is_active: true,
			sort_order: 1,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	source.data["public.return_entry_records"] = [
		{
			id: "70000000-0000-4000-8000-000000000002",
			kouden_entry_id: ids.entry,
			return_status: "PENDING",
			return_method: null,
			funeral_gift_amount: 0,
			arrangement_date: null,
			shipping_postal_code: null,
			shipping_address: null,
			shipping_phone_number: null,
			remarks: null,
			return_items: [],
			total_amount: 10000,
			return_items_cost: 0,
			additional_return_amount: 10000,
			profit_loss: 10000,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	return sourceWithCounts(source.data);
}

describe("rollback review regressions", () => {
	it.each(
		[
			{ name: "編集者", permissions: ["view", "edit"], role: "editor" as const },
			{ name: "閲覧者", permissions: ["view"], role: "viewer" as const },
			{ name: "editor", permissions: ["view"], role: "viewer" as const },
			{ name: "viewer", permissions: ["edit"], role: "editor" as const },
		].flatMap((row) => [false, true].map((existing) => ({ ...row, existing }))),
	)(
		"rejects legacy role $name for $role (existing: $existing)",
		({ name, permissions, role, existing }) => {
			const { source, current } = memberRoleFixture(role, existing, [{ name, permissions }]);
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([
				{ code: "missing_legacy_role", entityId: current.ledgers[0]!.koudenId },
			]);
			expect(plan.after.kouden_members).toEqual(plan.before.kouden_members);
			expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
		},
	);
	it.each(["viewer"] as const)(
		"selects a name-compatible %s role despite an earlier custom role",
		async (role) => {
			const permissions = ["view"];
			const { source, current, user } = memberRoleFixture(role, true, [
				{ name: "custom", permissions },
				{ name: role, permissions },
			]);
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([]);
			const db = await database(source);
			try {
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				expect(
					(
						await db.query(
							"SELECT r.name FROM kouden_members m JOIN kouden_roles r ON r.id = m.role_id WHERE m.user_id = $1",
							[user],
						)
					).rows,
				).toEqual([{ name: role }]);
			} finally {
				await db.close();
			}
		},
	);
	it.each([false, true])(
		"gives an ordinary editor the legacy editor role on both sides of the RLS migration (existing: %s)",
		async (existing) => {
			const { source, current, user } = memberRoleFixture("editor", existing, [
				{ name: "editor", permissions: ["view", "edit"] },
			]);
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([]);
			const db = await database(source);
			try {
				await installLegacyAuth(db, source, "telegram-rls");
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				await db.query(
					"INSERT INTO telegrams(id,kouden_id,sender_name,created_by) VALUES ($1,$2,'差出人',$3)",
					[ids.entry, ids.book, ids.user],
				);
				await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
				await db.exec("SET ROLE authenticated");
				expect(
					(
						await db.query(
							"SELECT r.name FROM kouden_members m JOIN kouden_roles r ON r.id=m.role_id WHERE m.user_id=auth.uid()",
						)
					).rows,
				).toEqual([{ name: "editor" }]);
				// 適用前の本番RLSでは、旧アプリで招待した編集者と同じく弔電を変更できない（権限が狭まるだけ）。
				expect((await db.query("UPDATE telegrams SET message='編集' RETURNING id")).rows).toEqual(
					[],
				);
				// RLS を editor に揃えるマイグレーション（#184）の適用後は変更できる。
				await db.exec(
					"RESET ROLE; ALTER POLICY telegram_update ON telegrams USING (EXISTS (SELECT 1 FROM public.kouden_members m JOIN public.kouden_roles r ON r.id=m.role_id WHERE m.kouden_id=telegrams.kouden_id AND m.user_id=auth.uid() AND r.name='editor')); SET ROLE authenticated",
				);
				expect((await db.query("UPDATE telegrams SET message='編集' RETURNING id")).rows).toEqual([
					{ id: ids.entry },
				]);
			} finally {
				await db.close();
			}
		},
	);
	it("reproduces the telegram RLS conflict for the canonical editor name", async () => {
		const { source, user } = memberRoleFixture("editor", true, [
			{ name: "editor", permissions: ["view", "edit"] },
		]);
		const db = await database(source);
		try {
			await installLegacyAuth(db, source, "telegram-rls");
			await db.query(
				"INSERT INTO telegrams(id,kouden_id,sender_name,created_by) VALUES ($1,$2,'差出人',$3)",
				[ids.entry, ids.book, ids.user],
			);
			await db.query(
				"UPDATE kouden_members SET role_id=(SELECT id FROM kouden_roles WHERE name='editor') WHERE user_id=$1",
				[user],
			);
			await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
			await db.exec("SET ROLE authenticated");
			expect(
				(
					await db.query(
						"SELECT name FROM kouden_roles r JOIN kouden_members m ON m.role_id=r.id WHERE m.user_id=auth.uid()",
					)
				).rows,
			).toEqual([{ name: "editor" }]);
			expect((await db.query("UPDATE telegrams SET message='編集' RETURNING id")).rows).toEqual([]);
			expect((await db.query("DELETE FROM telegrams RETURNING id")).rows).toEqual([]);
			await expect(
				db.query(
					"INSERT INTO telegrams(kouden_id,sender_name,created_by) VALUES ($1,'追加',auth.uid())",
					[ids.book],
				),
			).rejects.toThrow(/row-level security/);
			await db.exec(
				"RESET ROLE; UPDATE kouden_roles SET name='編集者' WHERE name='editor'; SET ROLE authenticated",
			);
			expect((await db.query("UPDATE telegrams SET message='編集' RETURNING id")).rows).toEqual([
				{ id: ids.entry },
			]);
		} finally {
			await db.close();
		}
	});
	it.each([false, true])(
		"preserves unmigrated members (remove migrated member: %s)",
		async (removeMember) => {
			const source = sourceFixture();
			const known = "10000000-0000-4000-8000-000000000002";
			const missing = "10000000-0000-4000-8000-000000000003";
			source.data["auth.users"]!.push({
				...source.data["auth.users"]![0],
				id: known,
				email: "member@example.test",
			});
			source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: known });
			for (const [i, user] of [known, missing].entries())
				source.data["public.kouden_members"]!.push({
					...source.data["public.kouden_members"]![0],
					id: `60000000-0000-4000-8000-00000000000${i + 2}`,
					user_id: user,
				});
			const counted = sourceWithCounts(source.data);
			const current = exportedFixture(counted);
			expect(current.manifest.members).toHaveLength(2);
			if (removeMember)
				current.manifest.members = current.manifest.members.filter((m) => m.role === "owner");
			const plan = planRollback(counted, current);
			expect(plan.blockers).toEqual([]);
			const kept = counted.data["public.kouden_members"]!.filter(
				(m) => !removeMember || m.user_id !== known,
			);
			expect(plan.after.kouden_members).toEqual(kept);
			expect(plan.changes.filter((c) => c.inserted || c.updated || c.deleted)).toEqual(
				removeMember ? [{ table: "kouden_members", inserted: 0, updated: 0, deleted: 1 }] : [],
			);
			const db = await database(counted);
			try {
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				expect(
					(await db.query("SELECT user_id::text FROM kouden_members ORDER BY user_id")).rows,
				).toEqual(kept.map((m) => ({ user_id: m.user_id })));
			} finally {
				await db.close();
			}
		},
	);
	it("blocks a relationship name that stays occupied by another enabled row", () => {
		const { source, current } = relationshipFixture();
		const [first, second] = current.ledgers[0]!.tables.relationships;
		first!.name = second!.name;
		const plan = planRollback(source, current);
		expect(plan.blockers).toContainEqual({
			code: "legacy_relationship_name_conflict",
			entityId: source.data["public.relationships"]![0]!.id,
			field: "name",
		});
		expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
	});
	it.each(["delete", "rename", "hide", "swap", "new"] as const)(
		"reuses a relationship name released when the other row is %s",
		async (mode) => {
			const { source, current } = relationshipFixture();
			const rows = current.ledgers[0]!.tables.relationships;
			const [first, second] = rows;
			const taken = String(second!.name);
			if (mode === "new")
				rows.push({
					...first!,
					id: "new-relationship",
					name: taken,
					sort_order: 2,
					created_at: "2024-01-03T00:00:00.000Z",
					updated_at: at,
				});
			else first!.name = taken;
			if (mode === "delete" || mode === "new") second!.deleted_at = at;
			if (mode === "rename") second!.name = "職場";
			if (mode === "swap") second!.name = source.data["public.relationships"]![0]!.name;
			if (mode === "hide") second!.is_hidden = 1;
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([]);
			const db = await database(source);
			try {
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				expect(
					(
						await db.query(
							"SELECT count(*)::int AS n FROM relationships WHERE is_enabled AND name = $1",
							[taken],
						)
					).rows,
				).toEqual([{ n: 1 }]);
				// 同じ計画の再実行は書かずに成功する。
				await db.exec(rollbackSql(plan, "apply"));
			} finally {
				await db.close();
			}
		},
	);
	it("blocks duplicate new relationship names", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.relationships = [0, 1].map((i) => ({
			id: `new-relationship-${i}`,
			name: "親族",
			sort_order: i,
			is_hidden: 0,
			created_at: `2024-01-0${i + 1}T00:00:00.000Z`,
			updated_at: at,
		}));
		const plan = planRollback(source, current);
		expect(plan.blockers.map((b) => b.code)).toEqual([
			"legacy_relationship_name_conflict",
			"legacy_relationship_name_conflict",
		]);
		expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
	});
	it("allows hidden duplicate names under the deployed partial unique index", async () => {
		const { source, current } = relationshipFixture();
		const [first, second] = current.ledgers[0]!.tables.relationships;
		second!.name = first!.name;
		second!.is_hidden = 1;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			// 非表示の同名関係を再表示すると実DBの一意制約に違反する。
			await expect(db.exec("UPDATE relationships SET is_enabled = true")).rejects.toThrow(
				/duplicate key/,
			);
		} finally {
			await db.close();
		}
		const hiddenSource = sourceWithCounts({
			...source.data,
			"public.relationships": plan.after.relationships,
		});
		const show = exportedFixture(hiddenSource);
		show.ledgers[0]!.tables.relationships[1]!.is_hidden = 0;
		expect(
			planRollback(hiddenSource, show).blockers.some(
				(b) => b.code === "legacy_relationship_name_conflict",
			),
		).toBe(true);
	});
	it("allows an unoccupied relationship rename in PostgreSQL", async () => {
		const { source, current } = relationshipFixture();
		current.ledgers[0]!.tables.relationships[0]!.name = "職場";
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
		} finally {
			await db.close();
		}
	});
	it.each(["editor", "removed"] as const)(
		"moves owner_id and created_by to the new owner when the former creator is %s",
		async (formerOwner) => {
			const { source, current } = ownershipTransferFixture(formerOwner);
			const next = "10000000-0000-4000-8000-000000000002";
			const plan = planRollback(source, current);
			expect(plan.blockers).toEqual([]);
			expect(plan.after.koudens[0]).toMatchObject({ owner_id: next, created_by: next });
			// 旧DBから消える元の作成者はレポートに残す。
			expect(plan.notices).toEqual([
				{
					code: "owner_transferred",
					entityId: current.ledgers[0]!.koudenId,
					legacyKoudenId: ids.book,
					previousOwnerId: ids.user,
					previousCreatedBy: ids.user,
					ownerId: next,
				},
			]);
			const db = await database(source);
			try {
				await installLegacyAuth(db, source, "allocation-rls");
				await db.exec(rollbackSql(plan, "apply"));
				await db.exec(rollbackSql(plan, "verify"));
				expect(
					(
						await db.query(
							"SELECT m.user_id::text, r.name FROM kouden_members m JOIN kouden_roles r ON r.id=m.role_id ORDER BY m.user_id",
						)
					).rows,
				).toEqual([
					...(formerOwner === "editor" ? [{ user_id: ids.user, name: "editor" }] : []),
					{ user_id: next, name: "editor" },
				]);
				await db.query(
					"INSERT INTO offerings(id,kouden_id,type,provider_name,created_by) VALUES ($1,$2,'FLOWER','供花',$3)",
					[ids.plan, ids.book, next],
				);
				const allocate = async (user: string) => {
					await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
					await db.exec("SET ROLE authenticated");
					try {
						// SELECT ポリシーを置いていないので RETURNING は使わない。
						return await db.query(
							"INSERT INTO offering_allocations(offering_id,allocated_amount,allocation_ratio) VALUES ($1,1000,1)",
							[ids.plan],
						);
					} finally {
						await db.exec("RESET ROLE");
					}
				};
				// 按分のRLSは created_by だけを見る。新オーナーは操作でき、元オーナーはできない。
				expect((await allocate(next)).affectedRows).toBe(1);
				await expect(allocate(ids.user)).rejects.toThrow(/row-level security/);
			} finally {
				await db.close();
			}
		},
	);
	it("allows title changes when ownership is unchanged", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.manifest.koudens[0]!.title = "更新した台帳名";
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.koudens[0]).toMatchObject({
			title: "更新した台帳名",
			owner_id: ids.user,
			created_by: ids.user,
		});
		expect(rollbackSql(plan, "apply")).toContain('UPDATE public.koudens SET ("title")');
	});
	it("uses the same in-memory source hash as the forward migration", () => {
		const source = sourceFixture();
		expect(planRollback(source, exportedFixture(source)).sourceSha256).toBe(
			prepareSnapshot(source).plan.sourceSha256,
		);
	});
	it("blocks catalog deletion when an omitted legacy detail still references it", async () => {
		const source = sourceWithReturn();
		source.data["public.return_record_items"] = [
			{
				id: "70000000-0000-4000-8000-000000000003",
				return_record_id: source.data["public.return_entry_records"]![0]!.id,
				return_item_master_id: source.data["public.return_items"]![0]!.id,
				price: 1000,
				quantity: 1,
				notes: null,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		expect(current.ledgers[0]!.tables.return_lines).toEqual([]);
		const item = current.ledgers[0]!.tables.return_items[0]!;
		item.deleted_at = at;
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([{ code: "delete_has_legacy_dependents", entityId: item.id }]);
		expect(plan.after.return_items).toEqual(plan.before.return_items);
		expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
		const db = await database(counted);
		try {
			await expect(db.exec("DELETE FROM return_items")).rejects.toThrow("foreign key");
		} finally {
			await db.close();
		}
	});
	it("still deletes an unused catalog item without legacy dependencies", async () => {
		const source = sourceWithReturn();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.return_items[0]!.deleted_at = at;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect((await db.query("SELECT id FROM return_items")).rows).toEqual([]);
		} finally {
			await db.close();
		}
	});
	it.each([null, "2026-11-01"])("reads raw return deadlines before projection: %s", (dueDate) => {
		const source = sourceWithReturn();
		const current = exportedFixture(source);
		const ret = current.ledgers[0]!.tables.returns[0]!;
		ret.due_date = dueDate;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.return_entry_records[0]!.remarks).toBe(
			dueDate ? `【v2】返礼期限: ${dueDate}` : null,
		);
	});
	it("ignores deadlines on tombstones that were never migrated", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.returns.push({
			id: "deleted-return",
			deleted_at: at,
			due_date: "2026-11-01",
		});
		expect(planRollback(source, current).blockers).toEqual([]);
	});
	it.each([false, true])("does not invent an inviter for a member (existing: %s)", (existing) => {
		const source = sourceFixture();
		source.data["public.kouden_roles"]![0]!.name = "viewer";
		source.data["public.kouden_roles"]![0]!.permissions = ["view"];
		const user = "10000000-0000-4000-8000-000000000002";
		source.data["auth.users"]!.push({
			id: user,
			email: "member@example.test",
			created_at: at,
			identities: [],
		});
		source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: user });
		if (existing)
			source.data["public.kouden_members"]!.push({
				...source.data["public.kouden_members"]![0],
				id: "60000000-0000-4000-8000-000000000002",
				user_id: user,
			});
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const uid = current.manifest.users.find((u) => u.legacy_user_id === user)!.id;
		if (existing) current.manifest.members.find((m) => m.user_id === uid)!.invited_by = null;
		else
			current.manifest.members.push({
				kouden_id: current.ledgers[0]!.koudenId,
				user_id: uid,
				role: "viewer",
				joined_at: at,
				invited_by: null,
			});
		const blocked = planRollback(counted, current);
		expect(blocked.blockers).toEqual([{ code: "member_inviter_requires_mapping", entityId: uid }]);
		expect(blocked.after.kouden_members).toEqual(blocked.before.kouden_members);
		expect(() => rollbackSql(blocked, "apply")).toThrow("rollback_blocked");
		current.manifest.members.find((m) => m.user_id === uid)!.invited_by =
			current.manifest.users.find((u) => u.legacy_user_id === ids.user)!.id;
		const valid = planRollback(counted, current);
		expect(valid.blockers).toEqual([]);
		expect(valid.after.kouden_members.find((m) => m.user_id === user)!.added_by).toBe(ids.user);
	});
});

const legacyMigration = (name: string) =>
	readFile(new URL(`../../../../supabase/migrations/${name}.sql`, import.meta.url), "utf8");

async function database(source: ReturnType<typeof sourceFixture>) {
	const db = new PGlite();
	await db.exec(await readFile(new URL("./fixtures/rollback-legacy.sql", import.meta.url), "utf8"));
	for (const table of ROLLBACK_TABLES)
		for (const row of source.data[`public.${table}`]!) {
			const fields = Object.keys(row).filter(
				(f) => !["additional_return_amount", "profit_loss"].includes(f),
			);
			await db.query(
				`INSERT INTO public.${table} (${fields.join(",")}) SELECT ${fields.join(",")} FROM jsonb_populate_record(NULL::public.${table}, $1::jsonb)`,
				[JSON.stringify(row)],
			);
		}
	return db;
}

async function installLegacyAuth(
	db: PGlite,
	source: ReturnType<typeof sourceFixture>,
	fixture: "audit" | "telegram-rls" | "allocation-rls",
) {
	await db.exec(
		await readFile(new URL("./fixtures/rollback-legacy-auth.sql", import.meta.url), "utf8"),
	);
	for (const user of source.data["auth.users"]!)
		await db.query("INSERT INTO auth.users(id) VALUES ($1)", [user.id]);
	await db.exec(
		await readFile(new URL(`./fixtures/rollback-legacy-${fixture}.sql`, import.meta.url), "utf8"),
	);
}

describe("rollback plan and PostgreSQL", () => {
	it("sets each entry actor for legacy audit triggers and restores the caller between writes", async () => {
		const source = sourceWithReturn();
		const secondUser = "10000000-0000-4000-8000-000000000002";
		const secondEntry = "30000000-0000-4000-8000-000000000002";
		source.data["auth.users"]!.push({
			...source.data["auth.users"]![0],
			id: secondUser,
			email: "editor@example.test",
		});
		source.data["public.profiles"]!.push({ ...source.data["public.profiles"]![0], id: secondUser });
		source.data["public.kouden_members"]!.push({
			...source.data["public.kouden_members"]![0],
			id: "60000000-0000-4000-8000-000000000002",
			user_id: secondUser,
		});
		source.data["public.kouden_entries"]!.push({
			...source.data["public.kouden_entries"]![0],
			id: secondEntry,
			name: "別の差出人",
		});
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const t = current.ledgers[0]!.tables;
		const gift = t.gifts.find((g) => g.id === newId.entryGift(ids.entry))!;
		gift.amount = 20000;
		gift.updated_by = newId.user(secondUser);
		const person = t.persons.find((p) => p.id === newId.entryPerson(secondEntry))!;
		person.name = "差出人の修正";
		person.updated_at = "2024-01-02T00:00:00.000Z";
		person.updated_by = newId.user(ids.user);
		t.gifts.push({ ...gift, id: "new-koden", created_by: newId.user(ids.user) });
		t.persons.push({ ...person, id: "new-person" });
		t.gift_contributors.push({
			gift_id: "new-koden",
			person_id: "new-person",
			is_primary: 1,
			share_amount: null,
		});
		t.returns[0]!.notes = "返礼の修正";
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(counted);
		try {
			await installLegacyAuth(db, counted, "audit");
			// last_modified_by の代入だけでは、BEFORE トリガーに NULL で上書きされる。
			await expect(
				db.query("UPDATE kouden_entries SET amount=20000,last_modified_by=$1 WHERE id=$2", [
					ids.user,
					ids.entry,
				]),
			).rejects.toThrow(/null value in column "user_id"/);
			await db.exec(
				"CREATE TABLE actor_probe(actor uuid); CREATE FUNCTION probe_actor() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.actor_probe VALUES(auth.uid()); RETURN NEW; END $$; CREATE TRIGGER probe_actor BEFORE UPDATE ON return_entry_records FOR EACH ROW EXECUTE FUNCTION probe_actor();",
			);
			await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [ids.plan]);
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			const inserted = plan.after.kouden_entries.find(
				(e) => !plan.before.kouden_entries.some((b) => b.id === e.id),
			)!;
			const expected = [
				{ entry_id: ids.entry, user_id: secondUser, action: "update" },
				{ entry_id: secondEntry, user_id: ids.user, action: "update" },
				{ entry_id: inserted.id, user_id: ids.user, action: "create" },
			].toSorted((a, b) => String(a.entry_id).localeCompare(String(b.entry_id)));
			expect(
				(
					await db.query(
						"SELECT entry_id,user_id,action FROM kouden_entry_audit_logs ORDER BY entry_id",
					)
				).rows,
			).toEqual(expected);
			expect((await db.query("SELECT actor FROM actor_probe")).rows).toEqual([{ actor: ids.plan }]);
			expect((await db.query("SELECT auth.uid() AS actor")).rows).toEqual([{ actor: ids.plan }]);
			await db.exec(rollbackSql(plan, "apply"));
			expect(
				(await db.query("SELECT count(*)::int AS count FROM kouden_entry_audit_logs")).rows,
			).toEqual([{ count: 3 }]);
		} finally {
			await db.close();
		}
	});
	it("rolls back the audit rows and actor when verification fails", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.gifts[0]!.amount = 20000;
		const plan = planRollback(source, current);
		const db = await database(source);
		try {
			await installLegacyAuth(db, source, "audit");
			await db.exec(
				"CREATE FUNCTION corrupt_amount() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.amount:=7; RETURN NEW; END $$; CREATE TRIGGER corrupt_amount BEFORE UPDATE ON kouden_entries FOR EACH ROW EXECUTE FUNCTION corrupt_amount();",
			);
			await expect(db.exec(rollbackSql(plan, "apply"))).rejects.toThrow(
				"rollback_verify_failed:kouden_entries",
			);
			await db.exec("ROLLBACK");
			expect(
				(await db.query("SELECT count(*)::int AS count FROM kouden_entry_audit_logs")).rows,
			).toEqual([{ count: 0 }]);
			expect((await db.query("SELECT amount,last_modified_by FROM kouden_entries")).rows).toEqual([
				{ amount: 10000, last_modified_by: null },
			]);
			expect((await db.query("SELECT auth.uid() AS actor")).rows).toEqual([{ actor: null }]);
		} finally {
			await db.close();
		}
	});
	it("refuses to generate an entry write without an audit actor", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.gifts[0]!.amount = 20000;
		const plan = planRollback(source, current);
		plan.after.kouden_entries[0]!.last_modified_by = null;
		expect(() => rollbackSql(plan, "apply")).toThrow("rollback_entry_actor_required");
	});
	it("keeps catalog ordering when migration normalized legacy ranks", () => {
		const source = sourceFixture();
		source.data["public.return_items"] = [
			{
				id: "90000000-0000-4000-8000-000000000001",
				kouden_id: ids.book,
				name: "旧品",
				category: null,
				price: 1000,
				description: null,
				image_url: null,
				is_active: true,
				sort_order: 20,
				recommended_amount_min: null,
				recommended_amount_max: null,
				created_at: at,
				updated_at: at,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		const items = current.ledgers[0]!.tables.return_items;
		items.push({ ...items[0], id: "new-item", name: "追加品", sort_order: 2 });
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.return_items.map((r) => [r.name, r.sort_order])).toEqual([
			["旧品", 1],
			["追加品", 2],
		]);
	});
	it("uses the creation time of a new relationship and refuses incompatible ordering", () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.relationships.push({
			id: "new-relationship",
			name: "追加関係",
			sort_order: 1,
			is_hidden: 0,
			created_at: "2026-10-14T00:00:00.000Z",
			updated_at: "2026-10-14T00:00:00.000Z",
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after.relationships[0]!.created_at).toBe("2026-10-14T00:00:00.000Z");
		current.ledgers[0]!.tables.relationships.push({
			id: "new-relationship-2",
			name: "次の関係",
			sort_order: 0,
			is_hidden: 0,
			created_at: "2026-10-15T00:00:00.000Z",
			updated_at: "2026-10-15T00:00:00.000Z",
		});
		expect(
			planRollback(source, current).blockers.some(
				(b) => b.code === "relationship_order_requires_mapping",
			),
		).toBe(true);
	});
	it("adds offerings, telegrams, a catalog item and a return without losing NULLs", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		const audit = {
			created_by: current.manifest.users[0]!.id,
			created_at: at,
			updated_by: current.manifest.users[0]!.id,
			updated_at: at,
		};
		for (const kind of ["kumotsu", "choden"]) {
			t.persons.push({ ...t.persons[0], id: `person-${kind}`, name: "追加差出人" });
			t.gifts.push({
				...t.gifts[0],
				id: `gift-${kind}`,
				kind,
				amount: kind === "kumotsu" ? 3000 : null,
				quantity: kind === "kumotsu" ? 1 : null,
				item_name: kind === "kumotsu" ? "菓子" : null,
				message: kind === "choden" ? "弔電本文" : null,
				attendance: null,
			});
			t.gift_contributors.push({
				gift_id: `gift-${kind}`,
				person_id: `person-${kind}`,
				is_primary: 1,
				share_amount: null,
			});
		}
		t.return_items.push({
			id: "item-new",
			name: "返礼品",
			category: null,
			price: 1000,
			description: null,
			image_r2_key: null,
			is_active: 1,
			sort_order: 1,
			created_at: at,
			updated_at: at,
		});
		t.returns.push({
			id: "return-new",
			person_id: t.persons[0]!.id,
			status: "arranged",
			method: "shipping",
			on_day_amount: 0,
			arranged_at: "2024-01-01",
			shipped_at: null,
			ship_name: null,
			ship_postal_code: "1000001",
			ship_address: "試験住所",
			ship_phone: null,
			notes: null,
			...audit,
		});
		t.return_lines.push({
			id: "line-new",
			return_id: "return-new",
			return_item_id: "item-new",
			name: "返礼品",
			unit_price: 1000,
			quantity: 1,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect((await db.query("SELECT type, price FROM offerings")).rows).toEqual([
				{ type: "FOOD", price: 3000 },
			]);
			expect((await db.query("SELECT message FROM telegrams")).rows).toEqual([
				{ message: "弔電本文" },
			]);
		} finally {
			await db.close();
		}
	});

	it("clears a relationship reference before deleting the relationship", async () => {
		const source = sourceFixture();
		const relId = "80000000-0000-4000-8000-000000000001";
		source.data["public.relationships"] = [
			{
				id: relId,
				kouden_id: ids.book,
				name: "親族",
				description: "保持",
				is_enabled: true,
				is_default: false,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		source.data["public.kouden_entries"]![0]!.relationship_id = relId;
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		current.manifest.users[0]!.display_name = "変更";
		current.ledgers[0]!.tables.relationships = [];
		current.ledgers[0]!.tables.persons[0]!.relationship_id = null;
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(counted);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect((await db.query("SELECT name FROM relationships")).rows).toEqual([]);
		} finally {
			await db.close();
		}
	});
	it("rolls back if a legacy table outside the mapping still references a deleted catalog item", async () => {
		const source = sourceWithReturn();
		const current = exportedFixture(source);
		current.manifest.users[0]!.display_name = "変更";
		current.ledgers[0]!.tables.return_items[0]!.deleted_at = at;
		const plan = planRollback(source, current);
		const db = await database(source);
		try {
			await db.exec("CREATE TABLE legacy_reference(item_id uuid REFERENCES return_items(id))");
			await db.query("INSERT INTO legacy_reference VALUES ($1)", [
				source.data["public.return_items"]![0]!.id,
			]);
			await expect(db.exec(rollbackSql(plan, "apply"))).rejects.toThrow("foreign key");
			await db.exec("ROLLBACK");
			expect((await db.query("SELECT display_name FROM profiles")).rows).toEqual([
				{ display_name: "試験利用者" },
			]);
		} finally {
			await db.close();
		}
	});
	it("unchanged imports produce no writes and preserve unmapped columns and whitespace", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		expect(plan.after).toEqual(plan.before);
		const db = await database(source);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
		} finally {
			await db.close();
		}
	});
	it("updates, inserts, NULLs and quotes round-trip; repeated apply is safe", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		t.gifts[0]!.amount = 12000;
		t.persons[0]!.name = null;
		t.persons[0]!.organization = "試験'); DROP TABLE profiles; -- $rollback$ \\";
		const person = { ...t.persons[0], id: "new-person", name: "追加", organization: null };
		const gift = { ...t.gifts[0], id: "new-gift", amount: 2000 };
		t.persons.push(person);
		t.gifts.push(gift);
		t.gift_contributors.push({
			gift_id: gift.id,
			person_id: person.id,
			is_primary: 1,
			share_amount: null,
		});
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(source);
		try {
			const sql = rollbackSql(plan, "apply");
			expect(sql).not.toContain("試験'); DROP");
			await db.exec(sql);
			await db.exec(sql);
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query(
						"SELECT count(*)::int AS n, sum(amount)::int AS amount FROM kouden_entries",
					)
				).rows,
			).toEqual([{ n: 2, amount: 14000 }]);
			expect(
				(
					await db.query(
						"SELECT is_duplicate, name, organization FROM kouden_entries WHERE id=$1",
						[ids.entry],
					)
				).rows,
			).toEqual([{ is_duplicate: true, name: null, organization: t.persons[0]!.organization }]);
			await db.exec("UPDATE kouden_entries SET amount=1");
			await expect(db.exec(rollbackSql(plan, "verify"))).rejects.toThrow("rollback_verify_failed");
		} finally {
			await db.exec("ROLLBACK");
			await db.close();
		}
	});
	it("refuses a stale database before writing any row", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.manifest.users[0]!.display_name = "更新";
		current.ledgers[0]!.tables.gifts[0]!.amount = 20000;
		const plan = planRollback(source, current);
		const db = await database(source);
		try {
			await db.exec("UPDATE kouden_entries SET amount=123");
			await expect(db.exec(rollbackSql(plan, "apply"))).rejects.toThrow(
				"rollback_precondition_failed:kouden_entries",
			);
			await db.exec("ROLLBACK");
			expect((await db.query("SELECT display_name FROM profiles")).rows).toEqual([
				{ display_name: "試験利用者" },
			]);
		} finally {
			await db.close();
		}
	});
	it("rolls back earlier updates if a trigger corrupts a later write", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		current.manifest.users[0]!.display_name = "更新";
		current.ledgers[0]!.tables.gifts[0]!.amount = 20000;
		const plan = planRollback(source, current);
		const db = await database(source);
		try {
			await db.exec(
				"CREATE FUNCTION corrupt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.amount:=7; RETURN NEW; END $$; CREATE TRIGGER corrupt BEFORE UPDATE ON kouden_entries FOR EACH ROW EXECUTE FUNCTION corrupt();",
			);
			await expect(db.exec(rollbackSql(plan, "apply"))).rejects.toThrow(
				"rollback_verify_failed:kouden_entries",
			);
			await db.exec("ROLLBACK");
			expect((await db.query("SELECT display_name FROM profiles")).rows).toEqual([
				{ display_name: "試験利用者" },
			]);
			expect((await db.query("SELECT amount FROM kouden_entries")).rows).toEqual([
				{ amount: 10000 },
			]);
		} finally {
			await db.close();
		}
	});
	it("updates return totals and generated columns using legacy trigger semantics", async () => {
		const source = sourceFixture();
		source.data["public.return_entry_records"] = [
			{
				id: "70000000-0000-4000-8000-000000000001",
				kouden_entry_id: ids.entry,
				return_status: "PENDING",
				return_method: null,
				funeral_gift_amount: 1000,
				arrangement_date: null,
				shipping_postal_code: null,
				shipping_address: null,
				shipping_phone_number: null,
				remarks: null,
				return_items: [],
				total_amount: 10000,
				return_items_cost: 0,
				additional_return_amount: 9000,
				profit_loss: 10000,
				created_at: at,
				updated_at: at,
				created_by: ids.user,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		current.ledgers[0]!.tables.gifts[0]!.amount = 15000;
		current.ledgers[0]!.tables.return_lines.push({
			id: "line-new",
			return_id: current.ledgers[0]!.tables.returns[0]!.id,
			return_item_id: null,
			name: "茶",
			unit_price: 2000,
			quantity: 2,
		});
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(counted);
		try {
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(
					await db.query(
						"SELECT total_amount::int, return_items_cost::int, additional_return_amount::int, profit_loss::int FROM return_entry_records",
					)
				).rows,
			).toEqual([
				{
					total_amount: 15000,
					return_items_cost: 4000,
					additional_return_amount: 14000,
					profit_loss: 11000,
				},
			]);
		} finally {
			await db.close();
		}
	});
	it("keeps the deployed return total after the migration aligning return triggers", async () => {
		const source = sourceWithReturn();
		const record = source.data["public.return_entry_records"]![0]!;
		record.return_items_cost = 1000;
		record.profit_loss = 9000;
		source.data["public.return_record_items"] = [
			{
				id: "70000000-0000-4000-8000-000000000003",
				return_record_id: record.id,
				return_item_master_id: source.data["public.return_items"]![0]!.id,
				price: 1000,
				quantity: 1,
				notes: null,
				created_by: ids.user,
				created_at: at,
				updated_at: at,
			},
		];
		const counted = sourceWithCounts(source.data);
		const current = exportedFixture(counted);
		current.ledgers[0]!.tables.returns[0]!.notes = "返礼の備考を更新";
		const plan = planRollback(counted, current);
		expect(plan.blockers).toEqual([]);
		const db = await database(counted);
		try {
			// 本番と同じく、存在しない return_records を更新する明細トリガーを置く。
			await db.exec(
				"CREATE FUNCTION public.update_return_record_total_amount() RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$ BEGIN UPDATE public.return_records SET total_amount = 0; RETURN NULL; END $$; CREATE TRIGGER tr_update_return_record_total_amount AFTER INSERT OR DELETE OR UPDATE ON return_record_items FOR EACH ROW EXECUTE FUNCTION public.update_return_record_total_amount();",
			);
			// fixture の BEFORE トリガーを外し、20260616 のバックフィルが明細合計を残す環境を再現する。
			await db.exec("DROP TRIGGER return_total ON return_entry_records");
			await db.exec(
				await legacyMigration("20260616000000_atomize_return_entry_record_total_amount"),
			);
			expect((await db.query("SELECT total_amount::int FROM return_entry_records")).rows).toEqual([
				{ total_amount: 1000 },
			]);
			await expect(db.exec("UPDATE return_record_items SET notes = '明細'")).rejects.toThrow(
				/return_records/,
			);
			await db.exec(
				await legacyMigration("20261018000000_align_return_amount_triggers_with_deployed"),
			);
			await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			const amounts = async () =>
				(
					await db.query(
						"SELECT total_amount::int, return_items_cost::int, profit_loss::int FROM return_entry_records",
					)
				).rows;
			expect(await amounts()).toEqual([
				{ total_amount: 10000, return_items_cost: 1000, profit_loss: 9000 },
			]);
			// 明細の変更は return_items_cost だけを再計算し、total_amount は香典＋供物のまま。
			await db.query(
				"INSERT INTO return_record_items (return_record_id, return_item_master_id, price, quantity, created_by) VALUES ($1, $2, 500, 2, $3)",
				[record.id, source.data["public.return_items"]![0]!.id, ids.user],
			);
			expect(await amounts()).toEqual([
				{ total_amount: 10000, return_items_cost: 2000, profit_loss: 8000 },
			]);
		} finally {
			await db.close();
		}
	});
	it("recalculates return amounts when sources change or move after the alignment migration", async () => {
		const source = sourceWithCounts(sourceWithReturn().data);
		const [r1, e2, r2, offering] = [2, 3, 4, 5].map(
			(n) => `90000000-0000-4000-8000-00000000000${n}`,
		);
		const db = await database(source);
		try {
			await db.exec(
				await legacyMigration("20261018000000_align_return_amount_triggers_with_deployed"),
			);
			await db.query("UPDATE return_entry_records SET id = $1", [r1]);
			await db.query(
				"INSERT INTO kouden_entries SELECT (jsonb_populate_record(NULL::kouden_entries, to_jsonb(k) || jsonb_build_object('id', $1::uuid, 'amount', 5000))).* FROM kouden_entries k",
				[e2],
			);
			await db.query(
				"INSERT INTO return_entry_records (id, kouden_entry_id, created_by) VALUES ($1, $2, $3)",
				[r2, e2, ids.user],
			);
			await db.query(
				"INSERT INTO offerings (id, kouden_id, type, price, quantity, provider_name, created_by) VALUES ($1, $2, 'FLOWER', 2000, 1, '供物', $3)",
				[offering, ids.book, ids.user],
			);
			await db.query(
				"INSERT INTO offering_entries (offering_id, kouden_entry_id, created_by) VALUES ($1, $2, $3)",
				[offering, ids.entry, ids.user],
			);
			const state = async () =>
				(
					await db.query<{ total_amount: number; return_items_cost: number }>(
						"SELECT total_amount::int, return_items_cost::int FROM return_entry_records ORDER BY id",
					)
				).rows.map((r) => [r.total_amount, r.return_items_cost]);
			expect(await state()).toEqual([
				[12000, 0],
				[5000, 0],
			]);
			await db.exec("UPDATE offerings SET price = 3000");
			expect(await state()).toEqual([
				[13000, 0],
				[5000, 0],
			]);
			await db.query("UPDATE offering_entries SET kouden_entry_id = $1", [e2]);
			expect(await state()).toEqual([
				[10000, 0],
				[8000, 0],
			]);
			await db.query("UPDATE kouden_entries SET amount = 6000 WHERE id = $1", [e2]);
			expect(await state()).toEqual([
				[10000, 0],
				[9000, 0],
			]);
			await db.query(
				"INSERT INTO return_record_items (return_record_id, return_item_master_id, price, quantity, created_by) VALUES ($1, $2, 1000, 1, $3)",
				[r1, source.data["public.return_items"]![0]!.id, ids.user],
			);
			await db.query("UPDATE return_record_items SET return_record_id = $1", [r2]);
			expect(await state()).toEqual([
				[10000, 0],
				[9000, 1000],
			]);
			// 削除でも元の返礼記録を再計算する。
			await db.query(
				"INSERT INTO return_record_items (return_record_id, return_item_master_id, price, quantity, created_by) VALUES ($1, $2, 500, 1, $3)",
				[r1, source.data["public.return_items"]![0]!.id, ids.user],
			);
			expect(await state()).toEqual([
				[10000, 500],
				[9000, 1000],
			]);
			await db.query("DELETE FROM return_record_items WHERE return_record_id = $1", [r1]);
			expect(
				(
					await db.query(
						"SELECT return_items_cost::int, profit_loss::int FROM return_entry_records ORDER BY id",
					)
				).rows,
			).toEqual([
				{ return_items_cost: 0, profit_loss: 10000 },
				{ return_items_cost: 1000, profit_loss: 8000 },
			]);
		} finally {
			await db.close();
		}
	});
	it("blocks entry deletion so unmigrated audit history cannot be cascade-deleted", async () => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		const t = current.ledgers[0]!.tables;
		t.gifts[0]!.deleted_at = at;
		t.persons[0]!.deleted_at = at;
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([
			{ code: "deleted_entry_requires_manual_cleanup", entityId: t.gifts[0]!.id },
		]);
		expect(plan.after.kouden_entries).toEqual(plan.before.kouden_entries);
		const db = await database(source);
		try {
			await db.exec(
				"CREATE TABLE kouden_entry_audit_logs(entry_id uuid REFERENCES kouden_entries(id) ON DELETE CASCADE, changes jsonb)",
			);
			await db.query("INSERT INTO kouden_entry_audit_logs VALUES ($1, '{}'::jsonb)", [ids.entry]);
			await expect(async () => db.exec(rollbackSql(plan, "apply"))).rejects.toThrow(
				"rollback_blocked",
			);
			expect((await db.query("SELECT entry_id FROM kouden_entry_audit_logs")).rows).toEqual([
				{ entry_id: ids.entry },
			]);
			expect((await db.query("SELECT id FROM kouden_entries")).rows).toEqual([{ id: ids.entry }]);
		} finally {
			await db.close();
		}
	});
	it.each([
		[
			"user_identity_or_deletion",
			(c: ReturnType<typeof exportedFixture>) => {
				c.manifest.users[0]!.legacy_user_id = null;
			},
		],
		[
			"billing_requires_manual_reconciliation",
			(c: ReturnType<typeof exportedFixture>) => {
				c.manifest.koudens[0]!.plan = "free";
			},
		],
	] as const)("blocks unsupported change %s without generating SQL", (code, edit) => {
		const source = sourceFixture();
		const current = exportedFixture(source);
		edit(current);
		const plan = planRollback(source, current);
		expect(plan.blockers.some((b) => b.code === code || b.field === code)).toBe(true);
		expect(() => rollbackSql(plan, "apply")).toThrow("rollback_blocked");
	});
});

describe("rollback export and connection", () => {
	it("checks two complete reads, detects drift, and requires write freeze", async () => {
		const current = exportedFixture(sourceFixture());
		let reads = 0;
		const client = {
			origin: current.origin,
			async request(path: string) {
				reads++;
				return structuredClone(path.endsWith("manifest") ? current.manifest : current.ledgers[0]);
			},
		};
		await expect(captureRollback(client, false)).rejects.toThrow("rollback_writes_not_stopped");
		expect(reads).toBe(0);
		await expect(captureRollback(client, true)).resolves.toMatchObject({
			manifest: current.manifest,
		});
		const drift = {
			origin: current.origin,
			async request(path: string) {
				if (path.endsWith("manifest")) return current.manifest;
				return { ...current.ledgers[0], seq: ++reads };
			},
		};
		await expect(captureRollback(drift, true)).rejects.toThrow("rollback_source_changed");
	});
	it("rejects a wrong project, transaction pooler or unencrypted database", () => {
		const project = "abcdefghijklmnopqrst";
		const env = {
			PGHOST: `db.${project}.supabase.co`,
			PGUSER: "postgres",
			PGDATABASE: "postgres",
			PGPASSWORD: "never-log-me",
		};
		expect(checkedPgEnv(project, env).PGSSLMODE).toBe("verify-full");
		for (const patch of [
			{ PGHOST: "db.other.supabase.co" },
			{ PGPORT: "6543" },
			{ PGSSLMODE: "disable" },
		])
			expect(() => checkedPgEnv(project, { ...env, ...patch })).toThrow();
	});
});
