import type { ImportKoudenPayload, LedgerSnapshot } from "@kouden/domain";
import { z } from "zod";
import { newId, uuidv5 } from "./ids.ts";
import { digest, prepareSnapshot } from "./prepare.ts";
import { snapshotSchema } from "./schemas.ts";
import {
	activeLedger,
	canonical,
	rollbackExportSchema,
	sameRows,
	type Row,
} from "./rollback-export.ts";

/** FK の親から順。削除時は逆順に処理する。これ以外のテーブルには書かない。 */
export const ROLLBACK_TABLES = [
	"profiles",
	"koudens",
	"kouden_roles",
	"kouden_members",
	"kouden_purchases",
	"relationships",
	"kouden_entries",
	"offerings",
	"offering_allocations",
	"offering_entries",
	"offering_photos",
	"telegrams",
	"return_items",
	"return_entry_records",
	"return_record_items",
] as const;
export type Table = (typeof ROLLBACK_TABLES)[number];
export interface Blocker {
	code: string;
	entityId: string;
	field?: string;
}
export interface RollbackPlan {
	version: 1;
	sourceProject: string;
	sourceSha256: string;
	exportSha256: string;
	before: Record<Table, Row[]>;
	after: Record<Table, Row[]>;
	blockers: Blocker[];
	changes: { table: Table; inserted: number; updated: number; deleted: number }[];
	books: { id: string; seq: number; changedEntities: number }[];
}
const idOf = (row: Row) => z.uuid().parse(row.id);
const eq = (a: unknown, b: unknown) => canonical(a) === canonical(b);
const mapped = (next: Row, prev: Row | undefined, fields: Record<string, string>): Row =>
	Object.fromEntries(
		Object.entries(fields)
			.filter(([from]) => !prev || !eq(next[from], prev[from]))
			.map(([from, to]) => [to, next[from]]),
	);
const giftTable = (kind: string): Table =>
	kind === "koden" ? "kouden_entries" : kind === "choden" ? "telegrams" : "offerings";
const withoutAudit = (row: Row) =>
	Object.fromEntries(
		Object.entries(row).filter(
			([k]) => !["createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k),
		),
	);

export function planRollback(sourceInput: unknown, exportInput: unknown): RollbackPlan {
	const source = snapshotSchema.parse(sourceInput);
	const current = rollbackExportSchema.parse(exportInput);
	const entityIds = new Set<string>();
	for (const ledger of current.ledgers)
		for (const [table, rows] of Object.entries(ledger.tables)) {
			if (["change_log", "reminders", "gift_contributors"].includes(table)) continue;
			for (const row of rows) {
				const key = `${table}:${row.id}`;
				if (typeof row.id !== "string" || entityIds.has(key))
					throw new Error("rollback_duplicate_id");
				entityIds.add(key);
			}
		}
	if (
		new Set(current.manifest.users.map((u) => u.id)).size !== current.manifest.users.length ||
		new Set(current.manifest.purchases.map((p) => p.id)).size !== current.manifest.purchases.length
	)
		throw new Error("rollback_duplicate_id");
	const { plan: baseline } = prepareSnapshot(sourceInput);
	const before = Object.fromEntries(
		ROLLBACK_TABLES.map((t) => [t, source.data[`public.${t}`]!]),
	) as Record<Table, Row[]>;
	for (const rows of Object.values(before)) {
		const ids = rows.map(idOf);
		if (new Set(ids).size !== ids.length) throw new Error("rollback_duplicate_id");
	}
	const after = structuredClone(before);
	const blockers: Blocker[] = [];
	const block = (code: string, entityId: string, field?: string) =>
		blockers.push({ code, entityId, ...(field ? { field } : {}) });
	const users = new Map(baseline.users.map((u) => [u.id, u.legacyUserId]));
	const userId = (id: string) => {
		const legacy = users.get(id);
		if (!legacy) block("unmapped_user", id);
		return legacy ?? uuidv5(`rollback:user:${id}`);
	};
	for (const u of current.manifest.users) {
		const old = baseline.users.find((b) => b.id === u.id);
		if (!old || old.legacyUserId !== u.legacy_user_id || u.deleted_at != null) {
			block("user_identity_or_deletion", String(u.id));
			continue;
		}
		if (u.display_name !== old.displayName) {
			const profile = after.profiles.find((p) => p.id === old.legacyUserId);
			if (!profile) block("missing_profile", old.id);
			else profile.display_name = z.string().min(1).parse(u.display_name);
		}
	}
	for (const u of baseline.users)
		if (!current.manifest.users.some((r) => r.id === u.id)) block("missing_user", u.id);
	const bookIds = new Set(current.manifest.koudens.map((k) => k.id));
	if (
		bookIds.size !== current.manifest.koudens.length ||
		new Set(current.ledgers.map((l) => l.koudenId)).size !== current.ledgers.length
	)
		throw new Error("rollback_duplicate_id");
	if (
		!sameRows(
			[...bookIds],
			current.ledgers.map((l) => l.koudenId),
		)
	)
		throw new Error("rollback_book_mismatch");
	for (const row of current.manifest.koudens) {
		const base = baseline.koudens.find((b) => b.payload.koudenId === row.id)?.payload;
		if (!base) {
			block("new_book_requires_mapping", String(row.id));
			continue;
		}
		const raw = current.ledgers.find((l) => l.koudenId === row.id)!;
		// 取り込み用スキーマには返礼期限がなく、activeLedger で除かれる前に検査する。
		for (const r of raw.tables.returns)
			if (r.deleted_at == null && r.due_date != null)
				block("unrepresentable_field", String(r.id), "dueDate");
		const ledger = activeLedger(raw);
		const oldBook = after.koudens.find((k) => k.id === base.kouden.legacyKoudenId)!;
		if (row.legacy_kouden_id !== oldBook.id || !["active", "archived"].includes(String(row.status)))
			block("book_identity_or_status", base.koudenId);
		oldBook.title = row.title === base.kouden.title ? oldBook.title : z.string().parse(row.title);
		oldBook.status = row.status === base.kouden.status ? oldBook.status : row.status;
		oldBook.owner_id = userId(String(row.owner_user_id));
		if (row.deceased_name !== base.kouden.deceasedName)
			block("unrepresentable_field", base.koudenId, "deceasedName");
		const purchased = current.manifest.purchases.filter((p) => p.kouden_id === row.id);
		const expectedPurchases = base.purchases.map((p) => ({
			id: p.id,
			user_id: p.userId,
			amount: p.amount,
			stripe_checkout_session_id: p.stripeCheckoutSessionId,
			created_at: p.createdAt,
			source: "legacy",
			status: "paid",
		}));
		const projected = purchased.map((p) =>
			Object.fromEntries(
				Object.keys(
					expectedPurchases[0] ?? {
						id: 0,
						user_id: 0,
						amount: 0,
						stripe_checkout_session_id: 0,
						created_at: 0,
						source: 0,
						status: 0,
					},
				).map((key) => [key, p[key]]),
			),
		);
		if (!sameRows(projected, expectedPurchases) || row.plan !== "paid")
			block("billing_requires_manual_reconciliation", base.koudenId);
		reverseBook(base, ledger, before, after, block, userId, raw.tables.relationships);
		const members = current.manifest.members.filter((m) => m.kouden_id === row.id);
		const memberUsers = new Set(members.map((m) => m.user_id));
		if (
			memberUsers.size !== members.length ||
			members.filter((m) => m.role === "owner" && m.user_id === row.owner_user_id).length !== 1 ||
			members.filter((m) => m.role === "owner").length !== 1
		)
			block("invalid_members", base.koudenId);
		for (const m of members) {
			const oldMember = base.members.find((b) => b.userId === m.user_id);
			if (oldMember && oldMember.role === m.role && oldMember.invitedBy === m.invited_by) continue;
			const uid = userId(String(m.user_id));
			const roles = before.kouden_roles.filter((r) => r.kouden_id === oldBook.id);
			const role = roles.find((r) => {
				const edit = (r.permissions as string[]).some((p) =>
					["edit", "entry.write", "write", "manage", "admin"].includes(p),
				);
				return m.role === "viewer" ? !edit : ["owner", "editor"].includes(String(m.role)) && edit;
			});
			if (!role) {
				block("missing_legacy_role", base.koudenId);
				continue;
			}
			const oldRow = after.kouden_members.find(
				(r) => r.kouden_id === oldBook.id && r.user_id === uid,
			);
			// 旧 added_by は NOT NULL。招待者不明をオーナーによる招待に置き換えない。
			if (m.invited_by == null && (!oldRow || oldMember?.invitedBy !== null)) {
				block("member_inviter_requires_mapping", String(m.user_id));
				continue;
			}
			if (oldRow) {
				oldRow.role_id = role.id;
				if (m.invited_by != null) oldRow.added_by = userId(String(m.invited_by));
			} else
				after.kouden_members.push({
					id: uuidv5(`rollback:member:${row.id}:${uid}`),
					kouden_id: oldBook.id,
					user_id: uid,
					role_id: role.id,
					added_by: userId(String(m.invited_by)),
					created_at: m.joined_at,
					updated_at: m.joined_at,
					invitation_id: null,
				});
		}
		after.kouden_members = after.kouden_members.filter(
			(m) => m.kouden_id !== oldBook.id || memberUsers.has(newId.user(String(m.user_id))),
		);
	}
	for (const b of baseline.koudens)
		if (!bookIds.has(b.payload.koudenId))
			block("deleted_book_requires_manual_cleanup", b.payload.koudenId);
	// D1 の余分な参照を見逃さない。
	for (const r of [...current.manifest.members, ...current.manifest.purchases])
		if (!bookIds.has(r.kouden_id)) block("orphan_d1_row", String(r.id ?? r.user_id));
	const changes = ROLLBACK_TABLES.map((table) => ({
		table,
		inserted: after[table].filter((r) => !before[table].some((b) => b.id === r.id)).length,
		updated: after[table].filter((r) => before[table].some((b) => b.id === r.id && !eq(b, r)))
			.length,
		deleted: before[table].filter((r) => !after[table].some((a) => a.id === r.id)).length,
	}));
	return {
		version: 1,
		sourceProject: source.project_ref,
		sourceSha256: baseline.sourceSha256,
		exportSha256: digest(canonical(current)),
		before,
		after,
		blockers,
		changes,
		books: current.ledgers.map((l) => ({
			id: l.koudenId,
			seq: l.seq,
			changedEntities: new Set(
				l.tables.change_log
					.filter((r) => r.op !== "import")
					.map((r) => `${r.entity}:${r.entity_id}`),
			).size,
		})),
	};
}

function reverseBook(
	base: ImportKoudenPayload,
	now: LedgerSnapshot,
	before: Record<Table, Row[]>,
	after: Record<Table, Row[]>,
	block: (code: string, id: string, field?: string) => void,
	userId: (id: string) => string,
	relationshipRows: Row[],
) {
	const old = base.ledger;
	for (const [table, rows] of Object.entries(now)) {
		if (table === "contributors") continue;
		const ids = rows.map((r) => ("id" in r ? r.id : null));
		if (ids.includes(null) || new Set(ids).size !== ids.length)
			throw new Error("rollback_duplicate_id");
	}
	for (const g of now.gifts)
		if (!now.events.some((e) => e.id === g.eventId)) block("missing_event", g.id);
	for (const p of now.persons)
		if (p.relationshipId && !now.relationships.some((r) => r.id === p.relationshipId))
			block("missing_relationship", p.id);
	const contributorIds = now.contributors.map((c) => `${c.giftId}:${c.personId}`);
	if (new Set(contributorIds).size !== contributorIds.length)
		throw new Error("rollback_duplicate_id");
	for (const c of now.contributors)
		if (!now.gifts.some((g) => g.id === c.giftId) || !now.persons.some((p) => p.id === c.personId))
			block("orphan_contributor", c.giftId);
	const book = base.kouden.legacyKoudenId;
	const owner = userId(base.kouden.ownerUserId);
	const oldId = (table: Table, id: string, forward: (id: string) => string) => {
		const row = before[table].find((r) => forward(String(r.id)) === id);
		if (row && row.kouden_id !== book) block("id_belongs_to_another_book", id);
		return String(row?.id ?? uuidv5(`rollback:${table}:${id}`));
	};
	const remove = (table: Table, id: string) => {
		after[table] = after[table].filter((r) => r.id !== id);
	};
	const patch = (table: Table, id: string, values: Row, initial: Row = {}) => {
		const row = after[table].find((r) => r.id === id);
		if (row) Object.assign(row, values);
		else after[table].push({ id, ...initial, ...values });
	};
	const unsupported = (next: Row, prev: Row | undefined, fields: string[]) => {
		for (const f of fields)
			if (!eq(next[f] ?? null, prev?.[f] ?? null))
				block("unrepresentable_field", String(next.id), f);
	};
	const audit = (r: Row) => ({
		created_by: typeof r.createdBy === "string" ? userId(r.createdBy) : owner,
		created_at: r.createdAt ?? base.kouden.createdAt,
		updated_at: r.updatedAt ?? base.kouden.updatedAt,
	});
	const relationId = (id: string) => oldId("relationships", id, newId.relationship);
	const itemId = (id: string) => oldId("return_items", id, newId.returnItem);
	if (!sameRows(old.events, now.events)) block("events_require_manual_mapping", base.koudenId);
	if (!sameRows(old.returnRules, now.returnRules))
		block("return_rules_require_manual_mapping", base.koudenId);
	if (!sameRows(old.giftPhotos ?? [], now.giftPhotos ?? []))
		block("images_require_reverse_copy", base.koudenId);
	for (const r of now.relationships) {
		const prev = old.relationships.find((b) => b.id === r.id);
		if (prev && r.sortOrder !== prev.sortOrder) block("unrepresentable_field", r.id, "sortOrder");
		const values = mapped(r, prev, { name: "name", isHidden: "is_enabled" });
		if ("is_enabled" in values) values.is_enabled = !r.isHidden;
		const rawRelationship = relationshipRows.find((row) => row.id === r.id)!;
		if (Object.keys(values).length)
			patch("relationships", relationId(r.id), values, {
				kouden_id: book,
				...audit(
					prev
						? {}
						: {
								createdAt: z.iso.datetime().parse(rawRelationship.created_at),
								updatedAt: z.iso.datetime().parse(rawRelationship.updated_at),
							},
				),
				description: null,
				is_default: false,
			});
	}
	for (const r of old.relationships)
		if (!now.relationships.some((x) => x.id === r.id)) remove("relationships", relationId(r.id));
	if (!sameRows(old.relationships, now.relationships)) {
		const legacyOrder = after.relationships
			.filter((r) => r.kouden_id === book)
			.toSorted(
				(a, b) =>
					new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime() ||
					String(a.name).localeCompare(String(b.name)),
			)
			.map((r) => r.id);
		const expectedOrder = now.relationships
			.toSorted((a, b) => a.sortOrder - b.sortOrder)
			.map((r) => relationId(r.id));
		if (!eq(legacyOrder, expectedOrder))
			block("relationship_order_requires_mapping", base.koudenId);
	}
	const itemOrderChanged = !sameRows(
		old.returnItems.map((r) => ({ id: r.id, sortOrder: r.sortOrder })),
		now.returnItems.map((r) => ({ id: r.id, sortOrder: r.sortOrder })),
	);
	for (const r of now.returnItems) {
		const prev = old.returnItems.find((b) => b.id === r.id);
		unsupported(r, prev, ["imageR2Key"]);
		const values = mapped(r, prev, {
			name: "name",
			category: "category",
			price: "price",
			description: "description",
			isActive: "is_active",
			sortOrder: "sort_order",
		});
		// 移行時に 10,20 等の旧順位を 1,2 に直しているため、追加時も全体を揃える。
		if (itemOrderChanged) values.sort_order = r.sortOrder;
		if (Object.keys(values).length)
			patch("return_items", itemId(r.id), values, {
				kouden_id: book,
				...audit(r),
				image_url: null,
				recommended_amount_min: null,
				recommended_amount_max: null,
			});
	}
	for (const r of old.returnItems) {
		if (now.returnItems.some((x) => x.id === r.id)) continue;
		const id = itemId(r.id);
		if (after.return_record_items.some((line) => line.return_item_master_id === id))
			block("delete_has_legacy_dependents", r.id);
		else remove("return_items", id);
	}
	const giftOldId = (g: LedgerSnapshot["gifts"][number]) =>
		oldId(
			giftTable(g.kind),
			g.id,
			g.kind === "koden"
				? newId.entryGift
				: g.kind === "choden"
					? newId.telegramGift
					: newId.offeringGift,
		);
	const entryForPerson = new Map<string, string>();
	for (const g of now.gifts.filter((gift) => gift.kind === "koden")) {
		const contributors = now.contributors.filter((c) => c.giftId === g.id);
		if (
			contributors.length !== 1 ||
			!contributors[0]!.isPrimary ||
			contributors[0]!.shareAmount !== null
		) {
			block("koden_requires_single_person", g.id);
			continue;
		}
		const person = contributors[0]!.personId;
		if (entryForPerson.has(person)) block("person_has_multiple_koden", person);
		entryForPerson.set(person, giftOldId(g));
	}
	const represented = new Set<string>();
	for (const g of now.gifts) {
		const prev = old.gifts.find((b) => b.id === g.id);
		if (prev && giftTable(prev.kind) !== giftTable(g.kind)) {
			block("gift_kind_changed", g.id);
			continue;
		}
		const contributors = now.contributors.filter((c) => c.giftId === g.id);
		const previousContributors = old.contributors.filter((c) => c.giftId === g.id);
		const people = contributors.map((c) => now.persons.find((p) => p.id === c.personId));
		if (
			people.some((p) => !p) ||
			!people.length ||
			contributors.filter((c) => c.isPrimary).length !== 1
		) {
			block("invalid_contributors", g.id);
			continue;
		}
		for (const p of people) represented.add(p!.id);
		const person = people[contributors.findIndex((c) => c.isPrimary)]!;
		const oldPerson = old.persons.find(
			(p) => p.id === previousContributors.find((c) => c.isPrimary)?.personId,
		);
		const id = giftOldId(g);
		const values = mapped(g, prev, { notes: "notes" });
		if (g.kind === "koden") {
			unsupported(g, prev, ["itemName", "quantity", "message"]);
			Object.assign(
				values,
				mapped(g, prev, { amount: "amount", attendance: "attendance_type" }),
				mapped(person, oldPerson, {
					name: "name",
					organization: "organization",
					position: "position",
					postalCode: "postal_code",
					address: "address",
					phone: "phone_number",
					relationshipId: "relationship_id",
				}),
			);
			if ("attendance_type" in values) {
				if (g.attendance === null) block("attendance_required", g.id);
				values.attendance_type = {
					attended: "FUNERAL",
					condolence_visit: "CONDOLENCE_VISIT",
					absent: "ABSENT",
				}[g.attendance ?? "absent"];
			}
			if ("relationship_id" in values)
				values.relationship_id = person.relationshipId ? relationId(person.relationshipId) : null;
		} else if (g.kind === "choden") {
			unsupported(g, prev, ["amount", "itemName", "quantity", "attendance"]);
			if (contributors.length !== 1 || contributors[0]!.shareAmount !== null)
				block("telegram_requires_single_person", g.id);
			Object.assign(
				values,
				mapped(g, prev, { message: "message" }),
				mapped(person, oldPerson, {
					name: "sender_name",
					organization: "sender_organization",
					position: "sender_position",
				}),
			);
			if (!prev || !sameRows(contributors, previousContributors))
				values.kouden_entry_id = entryForPerson.get(person.id) ?? null;
			if ((!prev || "sender_name" in values) && person.name === null)
				block("sender_name_required", g.id);
		} else {
			unsupported(g, prev, ["message", "attendance"]);
			Object.assign(
				values,
				mapped(g, prev, { amount: "price", itemName: "description", quantity: "quantity" }),
			);
			if (!prev || prev.kind !== g.kind)
				values.type = { kyoka: "FLOWER", kumotsu: "FOOD", other: "OTHER" }[g.kind];
			if (("price" in values && g.amount === null) || ("quantity" in values && g.quantity === null))
				block("offering_amount_quantity_required", g.id);
			if (!prev || !eq(person.name, oldPerson?.name)) {
				if (person.name === null) block("provider_name_required", g.id);
				values.provider_name = person.name;
			}
			// 按分の備考・比率・参照は旧行のまま保つ。構成を変えた場合は別途確認する。
			if (prev && !sameRows(contributors, previousContributors))
				block("offering_allocation_changed", g.id);
			if (
				!prev &&
				(contributors.length !== 1 ||
					contributors[0]!.shareAmount !== null ||
					entryForPerson.has(person.id))
			)
				block("new_offering_allocation_requires_mapping", g.id);
		}
		if (Object.keys(values).length && g.kind === "koden" && prev) {
			const changedBy = person.updatedAt > g.updatedAt ? person.updatedBy : g.updatedBy;
			values.last_modified_by = userId(changedBy);
			values.last_modified_at = person.updatedAt > g.updatedAt ? person.updatedAt : g.updatedAt;
			values.version = Number(before.kouden_entries.find((e) => e.id === id)?.version ?? 0) + 1;
		}
		if (Object.keys(values).length)
			patch(giftTable(g.kind), id, values, {
				kouden_id: book,
				...audit(g),
				...(g.kind === "koden"
					? {
							has_offering: false,
							is_duplicate: false,
							version: 1,
							last_modified_at: g.updatedAt,
							last_modified_by: userId(g.updatedBy),
						}
					: {}),
			});
	}
	for (const p of now.persons) {
		const prev = old.persons.find((b) => b.id === p.id);
		unsupported(p, prev, ["nameKana", "notes"]);
		if (!represented.has(p.id)) block("person_without_gift", p.id);
		if (!entryForPerson.has(p.id)) {
			unsupported(p, prev, ["relationshipId", "postalCode", "address", "phone"]);
			if (
				now.contributors.some(
					(c) =>
						c.personId === p.id &&
						now.gifts.some((g) => g.id === c.giftId && !["koden", "choden"].includes(g.kind)),
				)
			)
				unsupported(p, prev, ["organization", "position"]);
		}
	}
	for (const g of old.gifts)
		if (!now.gifts.some((x) => x.id === g.id)) {
			const id = giftOldId(g);
			// 連携行の削除は旧 DB のトリガーで他テーブルにも影響するため、この版では停止する。
			const references = [
				...before.offering_entries,
				...before.offering_allocations,
				...before.offering_photos,
				...before.telegrams,
				...before.return_entry_records,
			].some((r) => r.kouden_entry_id === id || r.offering_id === id);
			if (references) block("delete_has_legacy_dependents", g.id);
			else remove(giftTable(g.kind), id);
		}
	for (const r of now.returns) {
		const prev = old.returns.find((b) => b.id === r.id);
		const lines = now.returnLines.filter((l) => l.returnId === r.id);
		const oldLines = old.returnLines.filter((l) => l.returnId === r.id);
		if (prev && eq(withoutAudit(r), withoutAudit(prev)) && sameRows(lines, oldLines)) continue;
		unsupported(r, prev, ["shipName", "shippedAt", ...(prev ? ["personId"] : [])]);
		const entry = entryForPerson.get(r.personId);
		if (!entry) {
			block("return_requires_single_koden", r.id);
			continue;
		}
		const records = before.return_entry_records.filter((row) => row.kouden_entry_id === entry);
		if (records.length > 1) {
			block("merged_return_requires_manual_mapping", r.id);
			continue;
		}
		const record = records[0];
		const id = record ? String(record.id) : uuidv5(`rollback:return:${r.id}`);
		if (
			before.return_record_items.some((l) => l.return_record_id === id) &&
			!sameRows(lines, oldLines)
		)
			block("legacy_return_lines_require_manual_mapping", r.id);
		const values = mapped(r, prev, {
			status: "return_status",
			method: "return_method",
			onDayAmount: "funeral_gift_amount",
			arrangedAt: "arrangement_date",
			shipPostalCode: "shipping_postal_code",
			shipAddress: "shipping_address",
			shipPhone: "shipping_phone_number",
			notes: "remarks",
		});
		if (r.status === "handed_on_day") block("unrepresentable_field", r.id, "status");
		if ("return_status" in values)
			values.return_status = {
				pending: "PENDING",
				handed_on_day: "COMPLETED",
				arranged: "PARTIAL_RETURNED",
				shipped: "COMPLETED",
				not_required: "NOT_REQUIRED",
			}[r.status];
		if (!prev || !sameRows(lines, oldLines)) {
			values.return_items = lines.map((l) => ({
				id: l.returnItemId ? itemId(l.returnItemId) : uuidv5(`rollback:line:${l.id}`),
				name: l.name,
				price: l.unitPrice,
				quantity: l.quantity,
			}));
			values.return_items_cost = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
		}
		const koden = after.kouden_entries.find((e) => e.id === entry);
		values.total_amount =
			Number(koden?.amount ?? 0) +
			after.offering_entries
				.filter((e) => e.kouden_entry_id === entry)
				.reduce((sum, link) => {
					const o = after.offerings.find((offering) => offering.id === link.offering_id);
					return sum + Number(o?.price ?? 0) * Number(o?.quantity ?? 0);
				}, 0);
		patch("return_entry_records", id, values, {
			kouden_entry_id: entry,
			...audit(r),
			additional_return_amount: null,
			profit_loss: null,
			return_items_cost: 0,
		});
	}
	for (const r of old.returns)
		if (!now.returns.some((x) => x.id === r.id))
			block("deleted_return_requires_manual_cleanup", r.id);
	for (const l of now.returnLines)
		if (!now.returns.some((r) => r.id === l.returnId)) block("orphan_return_line", l.id);
		else if (l.returnItemId && !now.returnItems.some((r) => r.id === l.returnItemId))
			block("missing_return_item", l.id);
	for (const r of now.returnRules)
		if (r.suggestedItemId && !now.returnItems.some((i) => i.id === r.suggestedItemId))
			block("missing_return_item", r.id);
	// 合計と生成列を旧 DB の式で再計算する。変更のない旧行はそのまま保存する。
	for (const r of after.return_entry_records) {
		const entry = after.kouden_entries.find(
			(e) => e.id === r.kouden_entry_id && e.kouden_id === book,
		);
		if (!entry) continue;
		const oldEntry = before.kouden_entries.find((e) => e.id === entry.id);
		const links = after.offering_entries.filter((e) => e.kouden_entry_id === entry.id);
		const offeringChanged = links.some(
			(l) =>
				!eq(
					before.offerings.find((o) => o.id === l.offering_id),
					after.offerings.find((o) => o.id === l.offering_id),
				),
		);
		if (oldEntry?.amount !== entry.amount || offeringChanged)
			r.total_amount =
				Number(entry.amount) +
				links.reduce((sum, l) => {
					const o = after.offerings.find((offering) => offering.id === l.offering_id);
					return sum + Number(o?.price ?? 0) * Number(o?.quantity ?? 0);
				}, 0);
		if (
			!eq(
				before.return_entry_records.find((b) => b.id === r.id),
				r,
			)
		) {
			for (const field of ["total_amount", "return_items_cost"])
				if (!Number.isSafeInteger(r[field]) || Number(r[field]) < 0)
					block("unsafe_amount", String(r.id), field);
			r.additional_return_amount = Math.max(
				0,
				Number(r.total_amount) - Number(r.funeral_gift_amount),
			);
			r.profit_loss = Number(r.total_amount) - Number(r.return_items_cost ?? 0);
		}
	}
}
