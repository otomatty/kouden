import { ledgerSnapshotSchema, type LedgerSnapshot } from "@kouden/domain";
import { z } from "zod";
import type { ImportClient } from "./client.ts";

export type Row = Record<string, unknown>;
const rows = z.array(z.record(z.string(), z.unknown()));
export const manifestSchema = z
	.object({ users: rows, koudens: rows, members: rows, purchases: rows })
	.strict();
export const ledgerExportSchema = z
	.object({
		schemaVersion: z.literal(3),
		koudenId: z.string().min(1),
		seq: z.number().int().nonnegative(),
		tables: z
			.object({
				events: rows,
				relationships: rows,
				persons: rows,
				gifts: rows,
				gift_contributors: rows,
				gift_photos: rows,
				return_items: rows,
				return_rules: rows,
				returns: rows,
				return_lines: rows,
				reminders: rows,
				change_log: rows,
			})
			.strict(),
	})
	.strict();
export const rollbackExportSchema = z
	.object({
		version: z.literal(1),
		origin: z.url(),
		capturedAt: z.iso.datetime(),
		writesStopped: z.literal(true),
		manifest: manifestSchema,
		ledgers: z.array(ledgerExportSchema),
	})
	.strict();
export type RollbackExport = z.infer<typeof rollbackExportSchema>;

/** キー順・SELECT の行順だけの違いで比較が変わらないようにする。配列の順序は保持する。 */
export function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (value && typeof value === "object")
		return `{${Object.entries(value)
			.toSorted(([a], [b]) => a.localeCompare(b))
			.map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`)
			.join(",")}}`;
	return JSON.stringify(value) ?? "null";
}
export function sameRows(a: unknown[], b: unknown[]): boolean {
	return canonical(a.map(canonical).toSorted()) === canonical(b.map(canonical).toSorted());
}

/** D1/DO を横断するトランザクションではない。書き込み停止は運用側で行い、ここでは変化を検知する。 */
export async function captureRollback(
	client: ImportClient,
	writesStopped: boolean,
): Promise<RollbackExport> {
	if (!writesStopped) throw new Error("rollback_writes_not_stopped");
	const capture = async () => {
		const manifest = manifestSchema.parse(
			await client.request("/internal/import/rollback/manifest"),
		);
		const ledgers = [];
		const ids = manifest.koudens.map((k) => z.string().min(1).max(64).parse(k.id));
		if (new Set(ids).size !== ids.length) throw new Error("rollback_duplicate_id");
		for (const id of ids) {
			const ledger = ledgerExportSchema.parse(
				await client.request(`/internal/import/rollback/koudens/${encodeURIComponent(id)}`),
			);
			if (ledger.koudenId !== id) throw new Error("rollback_book_mismatch");
			ledgers.push(ledger);
		}
		return { manifest, ledgers };
	};
	const first = await capture();
	const second = await capture();
	if (canonical(first) !== canonical(second)) throw new Error("rollback_source_changed");
	return {
		version: 1,
		origin: client.origin,
		capturedAt: new Date().toISOString(),
		writesStopped: true,
		...second,
	};
}

const camel = (row: Row) =>
	Object.fromEntries(
		Object.entries(row).map(([key, value]) => [
			key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
			["is_hidden", "is_primary", "is_active"].includes(key) ? value === 1 : value,
		]),
	);

/** 削除済みの行は書き戻さない。生データは export ファイル側に残す。 */
export function activeLedger(input: z.infer<typeof ledgerExportSchema>): LedgerSnapshot {
	const active = (table: keyof typeof input.tables) =>
		input.tables[table].filter((r) => r.deleted_at == null).map(camel);
	const gifts = active("gifts");
	const giftIds = new Set(gifts.map((g) => g.id));
	return ledgerSnapshotSchema.parse({
		events: active("events"),
		relationships: active("relationships"),
		persons: active("persons"),
		gifts,
		contributors: active("gift_contributors").filter((r) => giftIds.has(r.giftId)),
		giftPhotos: active("gift_photos"),
		returnItems: active("return_items"),
		returnRules: active("return_rules"),
		returns: active("returns"),
		returnLines: active("return_lines"),
	});
}
