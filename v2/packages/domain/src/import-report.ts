import type { ImportKoudenPayload, ImportUser } from "./import.ts";
import { GIFT_KIND_VALUES, RETURN_STATUS_VALUES } from "./labels.ts";

/** 値をレポートやログに出さず、不一致の場所だけを返す。配列は件数・順序も照合する。 */
export function importDifferences(expected: unknown, actual: unknown, path = ""): string[] {
	if (Object.is(expected, actual)) return [];
	if (Array.isArray(expected)) {
		if (!Array.isArray(actual)) return [path];
		return [
			...(expected.length === actual.length ? [] : [`${path}.length`]),
			...expected.flatMap((value, i) => importDifferences(value, actual[i], `${path}[${i}]`)),
		];
	}
	if (expected !== null && typeof expected === "object") {
		if (actual === null || typeof actual !== "object" || Array.isArray(actual)) return [path];
		const row = actual as Record<string, unknown>;
		return Object.entries(expected).flatMap(([key, value]) =>
			importDifferences(value, row[key], path ? `${path}.${key}` : key),
		);
	}
	return [path];
}

/** 再投入後も既存の Google / 手動の紐づけは維持する。メールだけの人に null を強制しない。 */
export function expectedImportUser(u: ImportUser) {
	return {
		user: {
			id: u.id,
			legacyUserId: u.legacyUserId,
			email: u.email,
			displayName: u.displayName,
			createdAt: u.createdAt,
			...(u.googleSub === null ? {} : { googleSub: u.googleSub }),
		},
		legacy: {
			legacyUserId: u.legacyUserId,
			email: u.email,
			displayName: u.displayName,
			authProvider: u.googleSub === null ? "email" : "google",
		},
	};
}

/** 変換後 JSON から計算する投入後の期待値。reminders は実行日時で変わるため比較しない。 */
export function expectedImportState(p: ImportKoudenPayload) {
	const l = p.ledger;
	return {
		koudenId: p.koudenId,
		d1: {
			ownerUserId: p.kouden.ownerUserId,
			plan: "paid",
			status: p.kouden.status,
			legacyKoudenId: p.kouden.legacyKoudenId,
			kouden: p.kouden,
			members: Object.fromEntries(
				["owner", "editor", "viewer"].map((role) => [
					role,
					p.members.filter((m) => m.role === role).length,
				]),
			),
			paidPurchases: p.purchases.length,
			memberRows: p.members.toSorted((a, b) => a.userId.localeCompare(b.userId)),
			purchaseRows: p.purchases
				.map((r) => ({ ...r, source: "legacy", status: "paid" }))
				.toSorted((a, b) => a.id.localeCompare(b.id)),
		},
		ledger: {
			events: l.events.length,
			relationships: l.relationships.length,
			persons: l.persons.length,
			gifts: Object.fromEntries(
				GIFT_KIND_VALUES.map((kind) => [kind, l.gifts.filter((g) => g.kind === kind).length]),
			),
			kodenTotal: l.gifts
				.filter((g) => g.kind === "koden")
				.reduce((sum, g) => sum + (g.amount ?? 0), 0),
			returns: Object.fromEntries(
				RETURN_STATUS_VALUES.map((status) => [
					status,
					l.returns.filter((r) => r.status === status).length,
				]),
			),
			returnLines: l.returnLines.length,
			returnItems: l.returnItems.length,
			returnRules: l.returnRules.length,
		},
	};
}
