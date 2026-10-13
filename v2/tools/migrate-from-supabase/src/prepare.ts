import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { importKoudenPayloadSchema, importUserSchema } from "@kouden/domain";
import {
	fileMapSchema,
	legacyProfilesSchema,
	legacySourceSchema,
	legacyUsersSchema,
	planSchema,
	snapshotSchema,
	type MigrationPlan,
	type PreparedFile,
} from "./schemas.ts";
import { transformKouden, transformUsers } from "./transform.ts";
import { validatePayload, validateSourceComparison, validateUsers } from "./validation.ts";

export const digest = (bytes: string | Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
export const json = async (path: string): Promise<unknown> =>
	JSON.parse(await readFile(path, "utf8"));
export async function privateJson(path: string, value: unknown): Promise<void> {
	const temp = `${path}.tmp`;
	await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
	await rename(temp, path);
}

/** コネクタで取得した単一 SELECT のスナップショットを使う。Supabase へは接続しない。 */
export function prepareSnapshot(input: unknown): {
	plan: MigrationPlan;
	copies: { source: string; key: string }[];
} {
	const snapshot = snapshotSchema.parse(input);
	type Row = Record<string, unknown>;
	const taken = new Map<Row, number>();
	const usedTables = new Set<string>();
	const rows = (name: string): Row[] => {
		const table = snapshot.data[name];
		if (!table || snapshot.row_counts[name] !== table.length)
			throw new Error(`snapshot_count:${name}`);
		usedTables.add(name);
		return table;
	};
	const users = legacyUsersSchema.parse(rows("auth.users"));
	const profiles = legacyProfilesSchema.parse(rows("public.profiles"));
	const transformedUsers = transformUsers(users, profiles);
	const known = new Set(users.map((u) => u.id));
	const newUsers = transformedUsers.users.map((u) => importUserSchema.parse(u));
	validateUsers(newUsers);
	const newKnown = new Set(newUsers.map((u) => u.id));
	const copies: { source: string; key: string }[] = [];
	const warnings = [...transformedUsers.warnings];
	for (const [table, records] of Object.entries(snapshot.data)) {
		if (/^(common|gift|funeral)\./.test(table) && records.length)
			warnings.push({
				code: "unmapped_schema_data",
				legacyId: table,
				message: `${table} の ${records.length} 行は元スナップショットに保持しています。移行・保全方針の確認が必要です`,
			});
	}
	for (const table of [
		"kouden_roles",
		"kouden_members",
		"kouden_purchases",
		"relationships",
		"kouden_entries",
		"offerings",
		"offering_photos",
		"offering_allocations",
		"offering_entries",
		"telegrams",
		"return_items",
		"return_entry_records",
		"return_record_items",
	])
		rows(`public.${table}`);
	const books = rows("public.koudens");
	const take = (table: string, predicate: (r: Row) => boolean) => {
		const selected = rows(`public.${table}`).filter(predicate);
		for (const row of selected) taken.set(row, (taken.get(row) ?? 0) + 1);
		return selected;
	};
	const koudens = books.map((k) => {
		const own = (r: Row) => r.kouden_id === k.id;
		const entries = take("kouden_entries", own);
		const offerings = take("offerings", own);
		const entryIds = new Set(entries.map((e) => e.id));
		const offeringIds = new Set(offerings.map((e) => e.id));
		const returnRecords = take("return_entry_records", (r) => entryIds.has(r.kouden_entry_id));
		const recordIds = new Set(returnRecords.map((r) => r.id));
		const source = legacySourceSchema.parse({
			kouden: k,
			roles: take("kouden_roles", own),
			members: take("kouden_members", own),
			purchases: take("kouden_purchases", own),
			relationships: take("relationships", own),
			entries,
			offerings,
			offeringPhotos: take("offering_photos", (r) => offeringIds.has(r.offering_id)),
			offeringAllocations: take("offering_allocations", (r) => offeringIds.has(r.offering_id)),
			offeringEntries: take("offering_entries", (r) => offeringIds.has(r.offering_id)),
			telegrams: take("telegrams", own),
			returnItems: take("return_items", own),
			returnRecords,
			returnRecordItems: take("return_record_items", (r) => recordIds.has(r.return_record_id)),
		});
		for (const row of [...source.offeringAllocations, ...source.offeringEntries]) {
			if (!entryIds.has(row.kouden_entry_id)) throw new Error("source_reference:offering_entry");
		}
		for (const row of source.telegrams) {
			if (row.kouden_entry_id && !entryIds.has(row.kouden_entry_id))
				throw new Error("source_reference:telegram");
		}
		const transformed = transformKouden(source, known);
		const payload = importKoudenPayloadSchema.parse(transformed.payload);
		validatePayload(payload, newKnown);
		validateSourceComparison(source, payload, known);
		copies.push(...transformed.files);
		warnings.push(...transformed.warnings);
		return { payload, files: [] as PreparedFile[] };
	});
	for (const table of usedTables) {
		if (["auth.users", "public.profiles", "public.koudens"].includes(table)) continue;
		if (rows(table).some((row) => taken.get(row) !== 1))
			throw new Error(`unassigned_source:${table}`);
	}
	const plan = planSchema.parse({
		version: 1,
		sourceSha256: digest(JSON.stringify(input)),
		sourceProject: snapshot.project_ref,
		extractedAt: snapshot.extracted_at,
		users: newUsers,
		koudens,
		warnings,
	});
	validatePlan(plan, false);
	return { plan, copies };
}

export function validatePlan(plan: MigrationPlan, withFiles = true): void {
	validateUsers(plan.users);
	const known = new Set(plan.users.map((u) => u.id));
	const ids = plan.koudens.map((k) => k.payload.koudenId);
	const legacyIds = plan.koudens.map((k) => k.payload.kouden.legacyKoudenId);
	const purchaseIds = plan.koudens.flatMap((k) => k.payload.purchases.map((p) => p.id));
	for (const group of [ids, legacyIds, purchaseIds])
		if (new Set(group).size !== group.length) throw new Error("duplicate:plan_id");
	for (const k of plan.koudens) {
		validatePayload(k.payload, known);
		if (Buffer.byteLength(JSON.stringify(k.payload)) > 10 * 1024 * 1024)
			throw new Error("payload_too_large");
		if (!withFiles) continue;
		const keys = [
			...k.payload.ledger.returnItems.flatMap((r) => (r.imageR2Key ? [r.imageR2Key] : [])),
			...(k.payload.ledger.giftPhotos ?? []).map((p) => p.r2Key),
		].toSorted();
		if (JSON.stringify(keys) !== JSON.stringify(k.files.map((f) => f.key).toSorted()))
			throw new Error("file_manifest_mismatch");
		if (
			new Set(keys).size !== keys.length ||
			keys.some((key) => !key.startsWith(`koudens/${k.payload.koudenId}/`))
		)
			throw new Error("invalid_file_key");
	}
}

export async function prepare(
	sourcePath: string,
	outDir: string,
	fileMapPath?: string,
): Promise<MigrationPlan> {
	const raw = await readFile(sourcePath, "utf8");
	const { plan, copies } = prepareSnapshot(JSON.parse(raw));
	plan.sourceSha256 = digest(raw);
	const mapping = fileMapPath ? fileMapSchema.parse(await json(fileMapPath)) : [];
	if (new Set(mapping.map((m) => m.source)).size !== mapping.length)
		throw new Error("duplicate:file_source");
	// 全ての入力ファイルを検査してから出力する。ソース URL からの自動ダウンロードはしない。
	const blobs = new Map<string, Uint8Array>();
	for (const copy of copies) {
		const mapped = mapping.find((m) => m.source === copy.source);
		if (!fileMapPath || !mapped) throw new Error("missing:image_file_map");
		const root = await realpath(dirname(resolve(fileMapPath)));
		const path = await realpath(resolve(root, mapped.path));
		const rel = relative(root, path);
		if (isAbsolute(rel) || rel === ".." || rel.startsWith(`..\\`) || rel.startsWith("../"))
			throw new Error("image_path_outside_map_directory");
		const info = await stat(path);
		if (!info.isFile() || info.size === 0 || info.size > 5 * 1024 * 1024)
			throw new Error("image_size");
		const bytes = await readFile(path);
		const sha256 = digest(bytes);
		const book = plan.koudens.find((k) => copy.key.startsWith(`koudens/${k.payload.koudenId}/`));
		if (!book) throw new Error("image_kouden_missing");
		book.files.push({ key: copy.key, size: bytes.length, sha256 });
		blobs.set(sha256, bytes);
	}
	validatePlan(planSchema.parse(plan));
	await mkdir(join(outDir, "files"), { recursive: true, mode: 0o700 });
	for (const [hash, bytes] of blobs)
		await writeFile(join(outDir, "files", `${hash}.bin`), bytes, { mode: 0o600 });
	await privateJson(join(outDir, "plan.json"), plan);
	return plan;
}

export async function loadPlan(dir: string): Promise<MigrationPlan> {
	const plan = planSchema.parse(await json(join(dir, "plan.json")));
	validatePlan(plan);
	return plan;
}
