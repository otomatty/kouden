import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { digest } from "../src/prepare.ts";
import { copyRollbackImages, createStorageClient } from "../src/rollback-images.ts";
import { planRollback, ROLLBACK_TABLES, type ImageCopy } from "../src/rollback-plan.ts";
import { rollbackSql } from "../src/rollback-sql.ts";
import { at, exportedFixture, ids, sourceFixture, sourceWithCounts } from "./rollback-fixture.ts";

const project = "abcdefghijklmnopqrst";
const publicUrl = (path: string) =>
	`https://${project}.supabase.co/storage/v1/object/public/return-items/${path}`;
const legacy = {
	offering: "90000000-0000-4000-8000-000000000001",
	photo: "91000000-0000-4000-8000-000000000001",
	item: "70000000-0000-4000-8000-000000000001",
};

/** 移行済みの供物写真と返礼品画像を持つ旧データ。 */
function sourceWithImages() {
	const source = sourceFixture();
	source.data["public.offerings"] = [
		{
			id: legacy.offering,
			kouden_id: ids.book,
			type: "FLOWER",
			description: "供花",
			quantity: 1,
			price: 5000,
			provider_name: "供花の差出人",
			notes: null,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	source.data["public.offering_photos"] = [
		{
			id: legacy.photo,
			offering_id: legacy.offering,
			storage_key: `${ids.user}/old.png`,
			caption: "旧写真",
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	source.data["public.return_items"] = [
		{
			id: legacy.item,
			kouden_id: ids.book,
			name: "タオル",
			price: 1000,
			category: null,
			description: null,
			image_url: publicUrl(`${ids.book}/${ids.user}/old.webp`),
			recommended_amount_min: null,
			recommended_amount_max: null,
			is_active: true,
			sort_order: 1,
			created_by: ids.user,
			created_at: at,
			updated_at: at,
		},
	];
	return sourceWithCounts(source.data);
}

/** v2 で返礼品画像の差し替え・画像付き品目の追加、写真の追加・削除をした状態。 */
function changedImages() {
	const source = sourceWithImages();
	const current = exportedFixture(source);
	const ledger = current.ledgers[0]!;
	const t = ledger.tables;
	const gift = t.gifts.find((g) => g.kind === "kyoka")!;
	const replaced = crypto.randomUUID();
	const added = crypto.randomUUID();
	const photo = crypto.randomUUID();
	t.return_items[0]!.image_r2_key = `koudens/${ledger.koudenId}/return-items/${replaced}`;
	t.return_items.push({
		...t.return_items[0],
		id: "item-new",
		name: "お茶",
		sort_order: 2,
		image_r2_key: `koudens/${ledger.koudenId}/return-items/${added}`,
	});
	t.gift_photos = [
		{
			...t.gift_photos[0],
			id: photo,
			r2_key: `koudens/${ledger.koudenId}/gifts/${gift.id}/${photo}`,
			caption: "追加写真",
		},
	];
	return { source, current, gift, replaced, added, photo };
}

async function database(source: ReturnType<typeof sourceFixture>) {
	const db = new PGlite();
	await db.exec(await readFile(new URL("./fixtures/rollback-legacy.sql", import.meta.url), "utf8"));
	for (const table of ROLLBACK_TABLES)
		for (const row of source.data[`public.${table}`]!) {
			const fields = Object.keys(row);
			await db.query(
				`INSERT INTO public.${table} (${fields.join(",")}) SELECT ${fields.join(",")} FROM jsonb_populate_record(NULL::public.${table}, $1::jsonb)`,
				[JSON.stringify(row)],
			);
		}
	return db;
}

describe("rollback image references", () => {
	it("plans deterministic Storage paths and writes the legacy references", async () => {
		const { source, current, replaced, added, photo } = changedImages();
		const plan = planRollback(source, current);
		expect(plan.blockers).toEqual([]);
		const kid = current.ledgers[0]!.koudenId;
		expect(plan.images).toEqual([
			{
				bucket: "return-items",
				path: `${ids.book}/${ids.user}/v2-${replaced}`,
				r2Key: `koudens/${kid}/return-items/${replaced}`,
			},
			{
				bucket: "return-items",
				path: `${ids.book}/${ids.user}/v2-${added}`,
				r2Key: `koudens/${kid}/return-items/${added}`,
			},
			{
				bucket: "offerings",
				path: `${ids.user}/v2-${photo}`,
				r2Key: current.ledgers[0]!.tables.gift_photos[0]!.r2_key,
			},
		]);
		expect(planRollback(source, current).images).toEqual(plan.images);
		const db = await database(source);
		try {
			for (let repeat = 0; repeat < 2; repeat++) await db.exec(rollbackSql(plan, "apply"));
			await db.exec(rollbackSql(plan, "verify"));
			expect(
				(await db.query("SELECT name, image_url FROM return_items ORDER BY sort_order")).rows,
			).toEqual([
				{ name: "タオル", image_url: publicUrl(plan.images[0]!.path) },
				{ name: "お茶", image_url: publicUrl(plan.images[1]!.path) },
			]);
			expect(
				(
					await db.query(
						"SELECT offering_id, storage_key, caption, created_by FROM offering_photos",
					)
				).rows,
			).toEqual([
				{
					offering_id: legacy.offering,
					storage_key: plan.images[2]!.path,
					caption: "追加写真",
					created_by: ids.user,
				},
			]);
		} finally {
			await db.close();
		}
	});

	it("keeps migrated images, clears a removed one and needs no copy", () => {
		const source = sourceWithImages();
		const unchanged = planRollback(source, exportedFixture(source));
		expect(unchanged.images).toEqual([]);
		expect(unchanged.changes.every((c) => !c.inserted && !c.updated && !c.deleted)).toBe(true);
		const current = exportedFixture(source);
		current.ledgers[0]!.tables.return_items[0]!.image_r2_key = null;
		const cleared = planRollback(source, current);
		expect(cleared.images).toEqual([]);
		expect(cleared.after.return_items[0]!.image_url).toBeNull();
	});

	it("blocks photos on non-offering gifts and keys of another book", () => {
		const { source, current } = changedImages();
		const t = current.ledgers[0]!.tables;
		const koden = t.gifts.find((g) => g.kind === "koden")!;
		t.gift_photos.push({ ...t.gift_photos[0], id: crypto.randomUUID(), gift_id: koden.id });
		t.return_items[0]!.image_r2_key = `koudens/other/return-items/${crypto.randomUUID()}`;
		const codes = planRollback(source, current).blockers.map((b) => b.code);
		expect(codes).toContain("photo_requires_offering");
		expect(codes).toContain("image_outside_book");
	});
});

const png = (n: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, n]);

/** Supabase Storage の REST API の振る舞いだけを再現する。未存在は旧版と同じ 400 を返す。 */
function fakeStorage(corrupt = false) {
	const objects = new Map<string, Uint8Array>();
	let uploads = 0;
	const fetcher = (async (input: string | URL | Request, init: RequestInit = {}) => {
		const url = new URL(String(input));
		const headers = new Headers(init.headers);
		if (url.origin !== `https://${project}.supabase.co` || headers.get("apikey") !== "secret")
			return new Response(null, { status: 401 });
		const read = url.pathname.match(/^\/storage\/v1\/object\/authenticated\/(.+)$/);
		if (read) {
			const bytes = objects.get(decodeURIComponent(read[1]!));
			return bytes ? new Response(new Uint8Array(bytes)) : new Response("{}", { status: 400 });
		}
		const key = decodeURIComponent(url.pathname.replace("/storage/v1/object/", ""));
		if (init.method !== "POST" || headers.get("x-upsert") !== "false")
			return new Response(null, { status: 405 });
		if (objects.has(key)) return new Response("{}", { status: 400 });
		const bytes = new Uint8Array(await new Response(init.body).arrayBuffer());
		uploads++;
		objects.set(key, corrupt ? bytes.subarray(1) : bytes);
		return new Response("{}");
	}) as typeof fetch;
	return {
		objects,
		uploads: () => uploads,
		client: createStorageClient(project, "secret", fetcher),
	};
}

function fakeR2(files: Record<string, Uint8Array>, sha?: string) {
	return {
		async download(path: string) {
			const bytes = files[new URL(path, "http://x").searchParams.get("key")!]!;
			return {
				bytes,
				headers: new Headers({
					"content-type": "image/png",
					"x-content-sha256": sha ?? digest(bytes),
				}),
			};
		},
	};
}

describe("rollback image transfer", () => {
	const images: ImageCopy[] = [
		{ bucket: "offerings", path: "user/v2-a", r2Key: "koudens/k/gifts/g/a" },
		{ bucket: "return-items", path: "book/user/v2-b", r2Key: "koudens/k/return-items/b" },
	];
	const r2 = { "koudens/k/gifts/g/a": png(1), "koudens/k/return-items/b": png(2) };

	it("copies, verifies size and SHA-256, and is safe to rerun", async () => {
		const storage = fakeStorage();
		const first = await copyRollbackImages(images, fakeR2(r2), storage.client);
		expect(first).toEqual([
			{ ...images[0], size: 9, sha256: digest(png(1)), copied: true },
			{ ...images[1], size: 9, sha256: digest(png(2)), copied: true },
		]);
		expect(storage.objects.get("offerings/user/v2-a")).toEqual(png(1));
		const again = await copyRollbackImages(images, fakeR2(r2), storage.client);
		expect(again.map((r) => r.copied)).toEqual([false, false]);
		expect(storage.uploads()).toBe(2);
	});

	it("stops without overwriting different content or trusting a bad transfer", async () => {
		const storage = fakeStorage();
		storage.objects.set("offerings/user/v2-a", png(9));
		await expect(copyRollbackImages(images, fakeR2(r2), storage.client)).rejects.toThrow(
			"rollback_storage_conflict",
		);
		expect(storage.objects.get("offerings/user/v2-a")).toEqual(png(9));
		await expect(
			copyRollbackImages(images, fakeR2(r2, "0".repeat(64)), fakeStorage().client),
		).rejects.toThrow("rollback_image_source_mismatch");
		await expect(copyRollbackImages(images, fakeR2(r2), fakeStorage(true).client)).rejects.toThrow(
			"rollback_storage_verify_failed",
		);
		expect(() => createStorageClient("other", "secret")).toThrow("rollback_invalid_project");
	});
});

it("refuses apply until the copy report covers every planned image", async () => {
	const dir = await mkdtemp(join(tmpdir(), "kouden-rollback-images-"));
	const cli = fileURLToPath(new URL("../src/rollback-cli.ts", import.meta.url));
	const { source, current } = changedImages();
	try {
		const sourcePath = join(dir, "source.json");
		const snapshotPath = join(dir, "v2.json");
		await writeFile(sourcePath, JSON.stringify(source));
		await writeFile(snapshotPath, JSON.stringify(current));
		const run = (...args: string[]) =>
			spawnSync("bun", [cli, ...args, "--source", sourcePath, "--snapshot", snapshotPath], {
				encoding: "utf8",
				timeout: 10000,
				windowsHide: true,
				env: { ...process.env, PGHOST: "", PGPASSWORD: "" },
			});
		expect(run("plan", "--out", join(dir, "plan")).status).toBe(0);
		const report = JSON.parse(await readFile(join(dir, "plan", "report.json"), "utf8"));
		expect(report.images).toHaveLength(3);
		const apply = (out: string, ...extra: string[]) =>
			run(
				"apply",
				"--out",
				join(dir, out),
				"--project-ref",
				project,
				"--writes-stopped",
				"--approve-sha256",
				report.sqlSha256,
				...extra,
			).stderr;
		expect(apply("missing")).toContain("rollback_images_not_copied");
		const partial = join(dir, "partial.json");
		await writeFile(
			partial,
			JSON.stringify({ exportSha256: report.exportSha256, images: report.images.slice(1) }),
		);
		expect(apply("partial", "--images", partial)).toContain("rollback_images_not_copied");
		const complete = join(dir, "images.json");
		await writeFile(
			complete,
			JSON.stringify({ exportSha256: report.exportSha256, images: report.images }),
		);
		// 画像の確認を通過し、DB 接続の検査で止まる。
		expect(apply("complete", "--images", complete)).toContain("rollback_database_target_mismatch");
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
	// bun を4回起動する。
}, 30000);
