import {
	expectedImportState,
	importDifferences,
	type ImportKoudenPayload,
	type ImportUser,
} from "@kouden/domain";
import { newId } from "./ids.ts";
import type { LegacyKoudenSource } from "./source.ts";
import { legacyCounts } from "./transform.ts";

const unique = (ids: string[], label: string) => {
	if (ids.length !== new Set(ids).size) throw new Error(`duplicate:${label}`);
};
export function validateUsers(users: ImportUser[]): void {
	unique(
		users.map((u) => u.id),
		"user",
	);
	unique(
		users.map((u) => u.legacyUserId),
		"legacy_user",
	);
	unique(
		users.flatMap((u) => (u.googleSub ? [u.googleSub] : [])),
		"google_sub",
	);
}

/** スキーマだけでは確認できない参照・一意制約を、書き込む前に全冊確認する。 */
export function validatePayload(p: ImportKoudenPayload, users: ReadonlySet<string>): void {
	if (!users.has(p.kouden.ownerUserId)) throw new Error("missing:owner");
	const owners = p.members.filter((m) => m.role === "owner");
	if (owners.length !== 1 || owners[0]?.userId !== p.kouden.ownerUserId)
		throw new Error("invalid:owner");
	unique(
		p.members.map((m) => m.userId),
		"member",
	);
	unique(
		p.purchases.map((r) => r.id),
		"purchase",
	);
	for (const m of p.members) {
		if (!users.has(m.userId) || (m.invitedBy && !users.has(m.invitedBy)))
			throw new Error("missing:member_user");
	}
	for (const r of p.purchases) if (!users.has(r.userId)) throw new Error("missing:purchase_user");
	const l = p.ledger;
	const sets = new Map<string, Set<string>>();
	for (const [table, rows] of Object.entries(l)) {
		if (table === "contributors") continue;
		const ids = rows.map((r) => (r as { id: string }).id);
		unique(ids, table);
		sets.set(table, new Set(ids));
	}
	const ref = (table: string, id: string | null) => {
		if (id !== null && !sets.get(table)?.has(id)) throw new Error(`missing:${table}`);
	};
	for (const r of l.persons) ref("relationships", r.relationshipId);
	for (const r of l.gifts) ref("events", r.eventId);
	for (const r of l.contributors) {
		ref("gifts", r.giftId);
		ref("persons", r.personId);
	}
	for (const r of l.returns) ref("persons", r.personId);
	for (const r of l.returnRules) ref("returnItems", r.suggestedItemId);
	for (const r of l.returnLines) {
		ref("returns", r.returnId);
		ref("returnItems", r.returnItemId);
	}
	unique(
		l.contributors.map((r) => `${r.giftId}:${r.personId}`),
		"contributor",
	);
	unique(
		l.returns.map((r) => r.personId),
		"return_person",
	);
	for (const g of l.gifts) {
		if (l.contributors.filter((c) => c.giftId === g.id && c.isPrimary).length !== 1)
			throw new Error("invalid:primary_contributor");
	}
}

export function validateSourceComparison(
	source: LegacyKoudenSource,
	p: ImportKoudenPayload,
	users: ReadonlySet<string>,
): void {
	const counts = legacyCounts(source, users);
	const expected = expectedImportState(p);
	const mismatches = importDifferences(
		{
			gifts: counts.gifts,
			returns: counts.returns,
			returnItems: counts.returnItems,
			// 正規化前の金額とも比較し、負の値の切り上げなどで金額が変わる移行を止める。
			kodenTotal: source.entries.reduce((sum, e) => sum + e.amount, 0),
		},
		expected.ledger,
	);
	if (
		counts.members !== p.members.length ||
		newId.user(source.kouden.owner_id) !== p.kouden.ownerUserId
	)
		mismatches.push("members");
	if (mismatches.length) throw new Error(`source_mismatch:${mismatches.join(",")}`);
}
