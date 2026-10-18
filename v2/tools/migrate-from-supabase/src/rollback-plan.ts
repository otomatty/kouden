import type { ImportKoudenPayload, LedgerSnapshot } from "@kouden/domain";
import { z } from "zod";
import { newId, uuidv5 } from "./ids.ts";
import { MISSING_NAME } from "./transform.ts";
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
/** 旧 Storage へ逆転送する画像。path は旧バケット内のパスで、v2 の ID から決定的に作る。 */
export interface ImageCopy {
	bucket: "return-items" | "offerings";
	path: string;
	r2Key: string;
}
export interface Blocker {
	code: string;
	entityId: string;
	field?: string;
}
/** 停止しないが、旧DBに書かない値や運用で扱う対象。レポートに残す。 */
export type Notice = Blocker & Row;
export interface RollbackPlan {
	version: 1;
	sourceProject: string;
	sourceSha256: string;
	exportSha256: string;
	before: Record<Table, Row[]>;
	after: Record<Table, Row[]>;
	blockers: Blocker[];
	notices: Notice[];
	images: ImageCopy[];
	changes: { table: Table; inserted: number; updated: number; deleted: number }[];
	books: { id: string; seq: number; changedEntities: number }[];
}
/** v2 で作ったユーザーの旧 Auth ID。運用者が Supabase Admin API で作ってから渡す（ROLLBACK.md）。 */
export const userMapSchema = z.array(
	z
		.object({
			v2UserId: z.string().min(1),
			legacyUserId: z.uuid().transform((id) => id.toLowerCase()),
		})
		.strict(),
);
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
/**
 * 旧画面の備考に足す決まった形式の行。再移行した備考から再び切り戻しても二重にしない。
 * 再移行の変換（transform.ts）が読み取れるよう、形式は ROLLBACK.md に揃える。
 */
const withLines = (text: string | null, lines: string[]) => {
	const present = new Set(text?.split("\n"));
	const added = lines.filter((l) => !present.has(l));
	return added.length ? [text, ...added].filter((l) => l).join("\n") : text;
};
/**
 * 備考の列に行を足す。v2 で備考を変えていなければ、旧行の値（前後の空白や移行時に足した行を含む）に足す。
 * 値が旧行と同じなら書かない。
 */
const appendLines = (values: Row, column: string, current: Row | undefined, lines: string[]) => {
	if (!lines.length) return;
	const text = (column in values ? values[column] : (current?.[column] ?? null)) as string | null;
	const next = withLines(text, lines);
	if (eq(next, current?.[column] ?? null)) delete values[column];
	else values[column] = next;
};
const withoutAudit = (row: Row) =>
	Object.fromEntries(
		Object.entries(row).filter(
			([k]) => !["createdAt", "updatedAt", "createdBy", "updatedBy"].includes(k),
		),
	);

export function planRollback(
	sourceInput: unknown,
	exportInput: unknown,
	userMapInput: unknown = [],
): RollbackPlan {
	const source = snapshotSchema.parse(sourceInput);
	const current = rollbackExportSchema.parse(exportInput);
	const userMap = userMapSchema.safeParse(userMapInput);
	if (!userMap.success) throw new Error("rollback_user_map_invalid");
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
	const notices: Notice[] = [];
	const notice = (code: string, entityId: string, detail: Row = {}) =>
		notices.push({ code, entityId, ...detail });
	const images: ImageCopy[] = [];
	// 旧アプリは返礼品画像を公開 URL、供物写真をバケット内のパスで参照する。
	const copyImage = (bucket: ImageCopy["bucket"], path: string, r2Key: string) => {
		images.push({ bucket, path, r2Key });
		return bucket === "return-items"
			? `https://${source.project_ref}.supabase.co/storage/v1/object/public/return-items/${path}`
			: path;
	};
	const users = new Map(baseline.users.map((u) => [u.id, u.legacyUserId]));
	const mappedUsers = new Map(userMap.data.map((m) => [m.v2UserId, m.legacyUserId]));
	const legacyAuth = new Set([
		...source.data["auth.users"]!.map((u) => u.id),
		...before.profiles.map((p) => p.id),
	]);
	// 移行済みのユーザーや既存の旧 Auth ユーザー（同じメールの利用者など）には寄せない。
	if (
		mappedUsers.size !== userMap.data.length ||
		new Set(mappedUsers.values()).size !== userMap.data.length ||
		userMap.data.some((m) => {
			const u = current.manifest.users.find((r) => r.id === m.v2UserId);
			return (
				!u ||
				u.legacy_user_id != null ||
				u.deleted_at != null ||
				users.has(m.v2UserId) ||
				legacyAuth.has(m.legacyUserId)
			);
		})
	)
		throw new Error("rollback_user_map_invalid");
	const userId = (id: string) => {
		const legacy = users.get(id) ?? mappedUsers.get(id);
		if (!legacy) block("unmapped_user", id);
		return legacy ?? uuidv5(`rollback:user:${id}`);
	};
	for (const u of current.manifest.users) {
		const old = baseline.users.find((b) => b.id === u.id);
		if (!old && u.legacy_user_id == null) {
			const legacy = mappedUsers.get(String(u.id));
			// 対応表にないユーザーは対象外。移行した冊から参照されていれば unmapped_user で停止する。
			if (!legacy) {
				notice("new_user_not_rolled_back", String(u.id));
				continue;
			}
			// Admin API で作った Auth ユーザーには旧DBのトリガーが profiles の行を作る。存在だけを前提にする。
			before.profiles.push({ id: legacy });
			after.profiles.push({ id: legacy, display_name: z.string().min(1).parse(u.display_name) });
			notice("new_user_mapped", String(u.id), { legacyUserId: legacy });
			continue;
		}
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
		// 切り替え後に作った冊は旧形式に戻さない。v2 の export とバックアップに残る（ROLLBACK.md）。
		if (!base) {
			notice("new_book_not_rolled_back", String(row.id));
			continue;
		}
		const raw = current.ledgers.find((l) => l.koudenId === row.id)!;
		// 取り込み用スキーマには返礼期限がなく、activeLedger で除かれる前に取り出す。
		const dueDates = new Map(
			raw.tables.returns
				.filter((r) => r.deleted_at == null && r.due_date != null)
				.map((r) => [String(r.id), String(r.due_date)]),
		);
		const ledger = activeLedger(raw);
		const oldBook = after.koudens.find((k) => k.id === base.kouden.legacyKoudenId)!;
		if (row.legacy_kouden_id !== oldBook.id || !["active", "archived"].includes(String(row.status)))
			block("book_identity_or_status", base.koudenId);
		oldBook.title = row.title === base.kouden.title ? oldBook.title : z.string().parse(row.title);
		oldBook.status = row.status === base.kouden.status ? oldBook.status : row.status;
		// 旧アプリ・RLS は created_by にも管理権限を与える（按分は created_by だけで判定する）。
		// v2 と同じ権限にするため両方を新オーナーにし、元の作成者はレポートに残す。
		const ownerId = userId(String(row.owner_user_id));
		const formerOwners = new Set([oldBook.owner_id, oldBook.created_by]);
		const transferred = ownerId !== oldBook.owner_id;
		if (transferred) {
			notice("owner_transferred", base.koudenId, {
				legacyKoudenId: oldBook.id,
				previousOwnerId: oldBook.owner_id,
				previousCreatedBy: oldBook.created_by,
				ownerId,
			});
			oldBook.owner_id = ownerId;
			oldBook.created_by = ownerId;
		}
		// 旧画面には台帳名（title）だけがある。故人名は export に残し、再移行時にオーナーに確認してもらう。
		if (row.deceased_name !== base.kouden.deceasedName)
			notice("deceased_name_not_rolled_back", base.koudenId);
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
		reverseBook(
			base,
			ledger,
			before,
			after,
			block,
			userId,
			raw.tables.relationships,
			notice,
			dueDates,
			copyImage,
		);
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
				// 旧アプリの認可は editor / viewer という名前で判定する。
				if (r.name !== (m.role === "owner" ? "editor" : m.role)) return false;
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
			// 弔電RLSが「編集者」を要求する間は、旧アプリで招待した編集者と同じく弔電を変更できない（ROLLBACK.md）。
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
		// forward で member_without_user として除外された旧行は、v2で削除された行ではない。
		const migratedMembers = new Set(base.members.map((m) => m.userId));
		after.kouden_members = after.kouden_members.filter((m) => {
			const uid = newId.user(String(m.user_id));
			return m.kouden_id !== oldBook.id || !migratedMembers.has(uid) || memberUsers.has(uid);
		});
		// 旧RLSは供物・弔電の行の created_by にも権限を与える（供物写真は親の供物の created_by で判定する）。
		// 行の作成者は書き換えないので、新オーナーでも編集者でもなくなった元オーナーが作った行があれば、
		// v2 にない権限が残るため停止する。元オーナー（旧 owner_id / created_by）ごとに判定する。
		if (transferred) {
			const editors = new Set(
				members
					.filter((m) => m.role === "editor")
					.map((m) => users.get(String(m.user_id)) ?? mappedUsers.get(String(m.user_id))),
			);
			const keepsAccess = (r: Row) =>
				formerOwners.has(r.created_by) &&
				r.created_by !== ownerId &&
				!editors.has(String(r.created_by));
			if (
				[...after.offerings, ...after.telegrams].some(
					(r) => r.kouden_id === oldBook.id && keepsAccess(r),
				)
			)
				block("former_owner_row_access_requires_mapping", base.koudenId);
		}
	}
	// v2 で削除した冊は旧DBで消さない。切り戻し後に旧アプリの削除処理で消す（ROLLBACK.md）。
	for (const b of baseline.koudens)
		if (!bookIds.has(b.payload.koudenId))
			notice("deleted_book_requires_manual_cleanup", b.payload.koudenId, {
				legacyKoudenId: b.payload.kouden.legacyKoudenId,
			});
	// 購入は冊の削除後も D1 に残る。移行した冊の購入は上で照合し、それ以外は戻す先がないので一覧に出す。
	const migratedBooks = new Set(baseline.koudens.map((b) => b.payload.koudenId));
	for (const p of current.manifest.purchases)
		if (!migratedBooks.has(String(p.kouden_id)) || !bookIds.has(p.kouden_id))
			notice("purchase_not_rolled_back", String(p.id), {
				koudenId: p.kouden_id,
				source: p.source,
				status: p.status,
				amount: p.amount,
			});
	// D1 の余分な参照を見逃さない。
	for (const m of current.manifest.members)
		if (!bookIds.has(m.kouden_id)) block("orphan_d1_row", String(m.user_id));
	// 実DBは有効な関係名だけ一意。SQLは変更前の名前を先に空けるので、最終状態だけを検査する。
	for (const r of after.relationships) {
		if (r.is_enabled !== true) continue;
		if (
			after.relationships.some(
				(other) =>
					other.id !== r.id &&
					other.kouden_id === r.kouden_id &&
					other.is_enabled === true &&
					other.name === r.name,
			)
		)
			block("legacy_relationship_name_conflict", String(r.id), "name");
	}
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
		notices,
		images,
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
	notice: (code: string, id: string, detail?: Row) => void,
	dueDates: Map<string, string>,
	copyImage: (bucket: ImageCopy["bucket"], path: string, r2Key: string) => string,
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
	// 作成者がない行の補完には、譲渡を反映した今のオーナーを使う（planRollback が先に台帳を更新する）。
	const owner = String(after.koudens.find((k) => k.id === book)!.owner_id);
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
	// offering_photos には kouden_id がないので、供物の台帳で所属を確かめる。
	const photoId = (id: string) => {
		const row = before.offering_photos.find((r) => newId.offeringPhoto(String(r.id)) === id);
		if (row && before.offerings.find((o) => o.id === row.offering_id)?.kouden_id !== book)
			block("id_belongs_to_another_book", id);
		return String(row?.id ?? uuidv5(`rollback:offering_photos:${id}`));
	};
	const copy = (bucket: ImageCopy["bucket"], path: string, r2Key: string) => {
		if (!r2Key.startsWith(`koudens/${base.koudenId}/`)) block("image_outside_book", r2Key);
		return copyImage(bucket, path, r2Key);
	};
	// 旧形式に行事はない。行事自体は export に残し、既定の「葬儀」以外のいただきものは備考に行事名を足す。
	const eventsById = new Map(now.events.map((e) => [e.id, e]));
	for (const e of old.events)
		if (!eq(e, eventsById.get(e.id))) notice("event_not_rolled_back", e.id);
	for (const e of now.events)
		if (!old.events.some((x) => x.id === e.id)) notice("event_not_rolled_back", e.id);
	const eventLines = (g: LedgerSnapshot["gifts"][number]) =>
		g.eventId === newId.event(book) ? [] : [`行事: ${eventsById.get(g.eventId)?.name ?? ""}`];
	// 旧形式の金額帯は返礼品ごとの推奨額だけ。1品に1つの半返しのルールに限って戻し、他は export に残す。
	const rulesChanged = !sameRows(old.returnRules, now.returnRules);
	const ruleForItem = new Map<string, LedgerSnapshot["returnRules"][number]>();
	if (rulesChanged)
		for (const r of now.returnRules) {
			const prev = old.returnRules.find((x) => x.id === r.id);
			if (
				r.ratioNumerator * 2 === r.ratioDenominator &&
				r.suggestedItemId &&
				// 移行時は無効な品の推奨額を、品を指さないルールにする。無効な品へは書き戻さない。
				now.returnItems.some((i) => i.id === r.suggestedItemId && i.isActive) &&
				now.returnRules.filter((x) => x.suggestedItemId === r.suggestedItemId).length === 1
			)
				ruleForItem.set(r.suggestedItemId, r);
			else if (!prev || !eq({ ...prev, sortOrder: 0 }, { ...r, sortOrder: 0 }))
				notice("return_rule_not_rolled_back", r.id);
		}
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
		const values = mapped(r, prev, {
			imageR2Key: "image_url",
			name: "name",
			category: "category",
			price: "price",
			description: "description",
			isActive: "is_active",
			sortOrder: "sort_order",
		});
		// 移行時に 10,20 等の旧順位を 1,2 に直しているため、追加時も全体を揃える。
		if (itemOrderChanged) values.sort_order = r.sortOrder;
		if (rulesChanged) {
			const current = after.return_items.find((x) => x.id === itemId(r.id));
			const rule = ruleForItem.get(r.id);
			// 移行時にこの品から作ったルールが残っていれば、書き戻せない編集（無効な品のルールなど）でも旧の値を保つ。
			// ルールが消えた、または別の品の半返しとして書き戻す場合だけ空にする。
			const own = current && newId.returnRule(String(current.id));
			const ownNow = now.returnRules.find((x) => x.id === own);
			const kept = !rule && ownNow !== undefined && ![...ruleForItem.values()].includes(ownNow);
			const [min, max] = rule ? [rule.minAmount, rule.maxAmount] : [null, null];
			if (
				!kept &&
				!eq([min, max], [current?.recommended_amount_min, current?.recommended_amount_max])
			) {
				values.recommended_amount_min = min;
				values.recommended_amount_max = max;
			}
		}
		if ("image_url" in values) {
			const id = itemId(r.id);
			// 旧アプリと同じ {台帳}/{作成者}/ の下に置く。
			const creator = after.return_items.find((x) => x.id === id)?.created_by ?? owner;
			values.image_url = r.imageR2Key
				? copy(
						"return-items",
						`${book}/${creator}/v2-${r.imageR2Key.split("/").pop()}`,
						r.imageR2Key,
					)
				: null;
		}
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
	for (const p of now.giftPhotos ?? []) {
		const prev = old.giftPhotos?.find((b) => b.id === p.id);
		const gift = now.gifts.find((g) => g.id === p.giftId);
		// 旧形式の写真は供物・供花だけに紐づく。
		if (!gift || giftTable(gift.kind) !== "offerings") {
			block("photo_requires_offering", p.id);
			continue;
		}
		const values = mapped(p, prev, {
			caption: "caption",
			giftId: "offering_id",
			r2Key: "storage_key",
		});
		if ("offering_id" in values) values.offering_id = giftOldId(gift);
		// 旧アプリと同じく作成者の ID を先頭のフォルダにする。
		if ("storage_key" in values)
			values.storage_key = copy("offerings", `${userId(p.createdBy)}/v2-${p.id}`, p.r2Key);
		if (Object.keys(values).length)
			patch("offering_photos", photoId(p.id), values, {
				created_by: userId(p.createdBy),
				created_at: p.createdAt,
				updated_at: p.updatedAt,
			});
	}
	// 旧 Storage の本体は消さない。参照だけを外す。
	for (const p of old.giftPhotos ?? [])
		if (!now.giftPhotos?.some((x) => x.id === p.id)) remove("offering_photos", photoId(p.id));
	// 旧形式は「香典 1 件 = 1 人」。代表者の香典ごとに旧の香典を作り、同じ人の返礼・弔電・供物は最初の香典に付ける。
	const kodenOf = new Map<string, LedgerSnapshot["gifts"]>();
	for (const g of now.gifts.filter((gift) => gift.kind === "koden")) {
		const primary = now.contributors.find((c) => c.giftId === g.id && c.isPrimary);
		if (primary) kodenOf.set(primary.personId, [...(kodenOf.get(primary.personId) ?? []), g]);
	}
	const entryForPerson = new Map<string, string>();
	for (const [person, gifts] of kodenOf) {
		const entries = gifts
			.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
			.map(giftOldId);
		// 旧の返礼記録がある香典を優先し、返礼記録を付け替えない。
		const entry =
			entries.find((e) => before.return_entry_records.some((r) => r.kouden_entry_id === e)) ??
			entries[0]!;
		entryForPerson.set(person, entry);
		if (gifts.length > 1)
			notice("person_has_multiple_koden", person, {
				kodenCount: gifts.length,
				returnEntryId: entry,
			});
	}
	// 連名の香典の代表者以外。旧形式に置き場がない住所などは export に残す。
	const jointOnly = new Set(
		now.contributors
			.filter(
				(c) =>
					!c.isPrimary &&
					!kodenOf.has(c.personId) &&
					now.gifts.some((g) => g.id === c.giftId && g.kind === "koden"),
			)
			.map((c) => c.personId),
	);
	/**
	 * 旧の按分（負担額・比率・代表者）と紐づけを、v2 の差出人に合わせる。按分は負担額のある差出人だけ。
	 * 比率は按分額÷供物の金額。旧行の備考は保つ。has_offering と返礼金額は旧DBのトリガーが更新する。
	 */
	const linkOffering = (
		offering: string,
		g: LedgerSnapshot["gifts"][number],
		links: (LedgerSnapshot["contributors"][number] & { entry: string })[],
	) => {
		const actor = userId(g.updatedBy);
		const amountChanged = !eq(old.gifts.find((b) => b.id === g.id)?.amount, g.amount);
		/** 消す按分の備考。移行時に供物の備考へ足した「差出人: 備考」と同じ形にする（transform.ts）。 */
		const droppedNotes: string[] = [];
		for (const table of ["offering_entries", "offering_allocations"] as const) {
			const wanted = links.filter((l) => table === "offering_entries" || l.shareAmount !== null);
			const seen = new Set<string>();
			for (const row of after[table].filter((r) => r.offering_id === offering)) {
				const keep = wanted.some((l) => l.entry === row.kouden_entry_id);
				if (!keep || seen.has(String(row.kouden_entry_id))) {
					remove(table, String(row.id));
					const note = String(row.contribution_notes ?? "").trim();
					const entry = before.kouden_entries.find((e) => e.id === row.kouden_entry_id);
					const label = [entry?.name, entry?.organization]
						.map((v) => String(v ?? "").trim())
						.find((v) => v);
					if (note) droppedNotes.push(`${label ?? MISSING_NAME}: ${note}`);
				}
				seen.add(String(row.kouden_entry_id));
			}
			for (const l of wanted) {
				const row = after[table].find(
					(r) => r.offering_id === offering && r.kouden_entry_id === l.entry,
				);
				const values: Row =
					table === "offering_entries"
						? {}
						: {
								allocated_amount: l.shareAmount,
								allocation_ratio: g.amount ? l.shareAmount! / g.amount : 0,
								is_primary_contributor: l.isPrimary,
							};
				for (const [k, v] of Object.entries(values)) if (row && eq(row[k], v)) delete values[k];
				// 負担額も供物の金額も変わらない按分は、旧の比率を保つ。
				if (
					row &&
					"allocation_ratio" in values &&
					eq(row.allocated_amount, l.shareAmount) &&
					!amountChanged
				)
					delete values.allocation_ratio;
				if (row) Object.assign(row, values);
				else
					after[table].push({
						id: uuidv5(`rollback:${table}:${g.id}:${l.personId}`),
						offering_id: offering,
						kouden_entry_id: l.entry,
						...values,
						...(table === "offering_allocations"
							? { contribution_notes: null, updated_at: g.updatedAt }
							: {}),
						created_by: actor,
						created_at: g.updatedAt,
					});
			}
		}
		return droppedNotes;
	};
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
			const others = people.filter((p) => p !== person);
			if (others.length)
				notice("joint_koden_flattened", g.id, { personIds: others.map((p) => p!.id) });
			appendLines(
				values,
				"notes",
				after.kouden_entries.find((e) => e.id === id),
				[
					...eventLines(g),
					...(others.length
						? [`連名: ${others.map((p) => p!.name ?? p!.organization).join("、")}`]
						: []),
				],
			);
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
			appendLines(
				values,
				"notes",
				after.telegrams.find((e) => e.id === id),
				eventLines(g),
			);
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
			let dropped: string[] = [];
			// 金額だけを変えた場合も、按分の比率（按分額÷供物の金額）を合わせ直す。
			if (!prev || !sameRows(contributors, previousContributors) || prev.amount !== g.amount) {
				const entries = contributors.map((c) => entryForPerson.get(c.personId));
				// 差出人に香典がない供物は、旧形式では provider_name だけで表す（紐づけを作らない）。
				if (
					entries.some((e) => e === undefined) &&
					(entries.some((e) => e !== undefined) ||
						contributors.length !== 1 ||
						contributors[0]!.shareAmount !== null)
				)
					block("offering_contributor_without_koden", g.id);
				// 消す按分の備考だけを、旧の供物の備考に足してから消す（残す按分の備考は二重にしない）。
				else
					dropped = linkOffering(
						id,
						g,
						contributors.flatMap((c, i) => (entries[i] ? [{ ...c, entry: entries[i] }] : [])),
					);
			}
			appendLines(
				values,
				"notes",
				after.offerings.find((e) => e.id === id),
				[...dropped, ...eventLines(g)],
			);
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
		// 旧形式には住所録がない。いただきもののない差出人は書き戻さず export に残す。
		if (!represented.has(p.id)) {
			notice("person_without_gift", p.id);
			continue;
		}
		unsupported(p, prev, ["notes"]);
		// 読み仮名は旧画面の並べ替え・検索に使えず、備考に足すと香典の備考が埋まる。export に残す。
		if (!eq(p.nameKana, prev?.nameKana ?? null)) notice("name_kana_not_rolled_back", p.id);
		if (jointOnly.has(p.id)) continue;
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
			// 香典の旧監査履歴・ロックは CASCADE で消えるため、SQL が削除前に退避・照合する。
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
	/** 今の返礼が使う旧の返礼記録。削除した返礼を同じ人に作り直した場合は、記録を消さずに使う。 */
	const claimedRecords = new Set<string>();
	for (const r of now.returns) {
		const prev = old.returns.find((b) => b.id === r.id);
		const lines = now.returnLines.filter((l) => l.returnId === r.id);
		const oldLines = old.returnLines.filter((l) => l.returnId === r.id);
		if (
			prev &&
			eq(withoutAudit(r), withoutAudit(prev)) &&
			sameRows(lines, oldLines) &&
			!dueDates.has(r.id)
		)
			continue;
		if (prev) unsupported(r, prev, ["personId"]);
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
		claimedRecords.add(id);
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
		// 旧形式に欄・状態のない値は、備考に決まった形式で足す。当日返しは「完了」と方法「on_day」で表す。
		// 移行時に最後の更新日から作った発送日は、変わっていなければ足さない。
		const changed = (f: "shipName" | "shippedAt") => r[f] !== null && !eq(r[f], prev?.[f] ?? null);
		appendLines(
			values,
			"remarks",
			after.return_entry_records.find((x) => x.id === id),
			[
				...(r.status === "handed_on_day" && r.method !== "on_day" ? ["【v2】当日返し済み"] : []),
				...(changed("shipName") ? [`【v2】送付先氏名: ${r.shipName}`] : []),
				...(changed("shippedAt") ? [`【v2】発送日: ${r.shippedAt}`] : []),
				...(dueDates.has(r.id) ? [`【v2】返礼期限: ${dueDates.get(r.id)}`] : []),
			],
		);
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
		// 実DBの BEFORE トリガー trigger_update_return_entry_total_amount に合わせる。
		// total_amount は香典＋供物、旧明細の合計は return_items_cost（ROLLBACK.md 参照）。
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
	// 返礼記録を消すと、旧画面はその香典を「未対応」と表示する。返礼金額は香典の側にあり失われない。
	for (const r of old.returns) {
		if (now.returns.some((x) => x.id === r.id)) continue;
		const records = before.return_entry_records.filter(
			(row) => newId.return(String(row.kouden_entry_id)) === r.id,
		);
		if (records.some((row) => claimedRecords.has(String(row.id)))) continue;
		if (records.length > 1) block("merged_return_requires_manual_mapping", r.id);
		// 記録がなく旧香典の「返礼済み」の印だけから作った返礼は、印を戻す先を確かめていない。
		// 記録を消しても旧香典の「返礼済み」の印が残ると、旧画面は返礼済みと表示する。印の列は本番にないこともあり書かない。
		else if (
			!records.length ||
			before.kouden_entries.some(
				(e) => e.id === records[0]!.kouden_entry_id && e.is_return_completed === true,
			)
		)
			block("deleted_return_requires_manual_cleanup", r.id);
		else if (before.return_record_items.some((l) => l.return_record_id === records[0]!.id))
			block("legacy_return_lines_require_manual_mapping", r.id);
		else remove("return_entry_records", String(records[0]!.id));
	}
	for (const l of now.returnLines)
		if (!now.returns.some((r) => r.id === l.returnId)) block("orphan_return_line", l.id);
		else if (l.returnItemId && !now.returnItems.some((r) => r.id === l.returnItemId))
			block("missing_return_item", l.id);
	for (const r of now.returnRules)
		if (r.suggestedItemId && !now.returnItems.some((i) => i.id === r.suggestedItemId))
			block("missing_return_item", r.id);
	// 紐づけを変えた香典は、旧DBのトリガー update_has_offering_flag が has_offering を更新する。
	for (const e of after.kouden_entries.filter((x) => x.kouden_id === book)) {
		const linked = (rows: Row[]) => rows.filter((l) => l.kouden_entry_id === e.id).map((l) => l.id);
		if (!sameRows(linked(before.offering_entries), linked(after.offering_entries)))
			e.has_offering = after.offering_entries.some((l) => l.kouden_entry_id === e.id);
	}
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
		const linksChanged = !sameRows(
			before.offering_entries
				.filter((e) => e.kouden_entry_id === entry.id)
				.map((l) => l.offering_id),
			links.map((l) => l.offering_id),
		);
		if (oldEntry?.amount !== entry.amount || offeringChanged || linksChanged)
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
