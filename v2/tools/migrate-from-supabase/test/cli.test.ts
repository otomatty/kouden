import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectedImportState, type ImportKoudenPayload, type ImportUser } from "@kouden/domain";
import { createImportClient, type ImportClient } from "../src/client.ts";
import { digest, loadPlan, prepare, prepareSnapshot } from "../src/prepare.ts";
import { runMigration } from "../src/run.ts";
import type { MigrationPlan } from "../src/schemas.ts";

const at = "2024-01-01T00:00:00Z";
const dirs: string[] = [];
async function temp() {
	const dir = await mkdtemp(join(tmpdir(), "kouden-migrate-"));
	dirs.push(dir);
	return dir;
}
afterEach(async () => {
	for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

function snapshot(withImage = false) {
	const data: Record<string, Record<string, unknown>[]> = {};
	for (const name of [
		"kouden_roles",
		"kouden_members",
		"kouden_purchases",
		"relationships",
		"offerings",
		"offering_allocations",
		"offering_entries",
		"offering_photos",
		"telegrams",
		"return_items",
		"return_entry_records",
		"return_record_items",
	])
		data[`public.${name}`] = [];
	data["auth.users"] = [
		{
			id: "u1",
			email: "owner@example.test",
			created_at: at,
			identities: [{ provider: "google", provider_id: "sub1" }],
		},
	];
	data["public.profiles"] = [{ id: "u1", display_name: "試験利用者" }];
	data["public.koudens"] = [
		{
			id: "k1",
			title: "試験の台帳",
			owner_id: "u1",
			status: "active",
			created_at: at,
			updated_at: at,
		},
	];
	data["public.kouden_entries"] = [
		{
			id: "e1",
			kouden_id: "k1",
			name: "試験差出人",
			organization: null,
			position: null,
			amount: 10000,
			postal_code: null,
			address: null,
			phone_number: null,
			relationship_id: null,
			attendance_type: "FUNERAL",
			notes: null,
			last_modified_by: null,
			created_by: "u1",
			created_at: at,
			updated_at: at,
		},
	];
	if (withImage)
		data["public.return_items"] = [
			{
				id: "ri1",
				kouden_id: "k1",
				name: "試験品",
				price: 3000,
				category: null,
				description: null,
				image_url: "https://source.example.test/private/image.png",
				is_active: true,
				sort_order: 1,
				recommended_amount_min: null,
				recommended_amount_max: null,
				created_at: at,
				updated_at: at,
			},
		];
	return {
		format_version: 1,
		project_ref: "test",
		extracted_at: at,
		data,
		row_counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
	};
}

function fakeClient(plan: MigrationPlan, corrupt = false) {
	const users = new Map<string, ImportUser>();
	const books = new Map<string, ImportKoudenPayload>();
	const files = new Map<string, { key: string; size: number; sha256: string }>();
	const calls: { path: string; method: string }[] = [];
	const client: ImportClient = {
		origin: "https://staging.example.test",
		async request(path, method = "GET", body) {
			calls.push({ path, method });
			const url = new URL(path, client.origin);
			if (path === "/internal/import/users" && method === "POST") {
				const batch = JSON.parse(String(body)) as { users: ImportUser[] };
				for (const u of batch.users) users.set(u.id, u);
				return { imported: batch.users.length };
			}
			if (path === "/internal/import/users/verify") {
				const batch = JSON.parse(String(body)) as { users: ImportUser[] };
				return {
					checked: batch.users.length,
					differences: batch.users.every((u) => users.has(u.id)) ? [] : ["missing"],
				};
			}
			if (path === "/internal/import/summary")
				return { users: users.size, legacyUsers: users.size, koudens: books.size };
			if (url.pathname === "/internal/import/files") {
				const key = url.searchParams.get("key") ?? "";
				if (method === "PUT") {
					if (!(body instanceof Uint8Array)) throw new Error("test_body");
					files.set(key, { key, size: body.length, sha256: digest(body) });
				}
				return files.get(key);
			}
			const id = url.pathname.split("/")[4] ?? "";
			if (url.pathname.endsWith("/files"))
				return {
					objects: [...files.values()]
						.filter((f) => f.key.startsWith(`koudens/${id}/`))
						.map((f) => ({ key: f.key, size: f.size })),
					cursor: null,
				};
			if (method === "PUT") {
				books.set(id, JSON.parse(String(body)) as ImportKoudenPayload);
				return { koudenId: id };
			}
			const payload = books.get(id);
			if (!payload) throw new Error("import_http_404");
			const state = expectedImportState(payload);
			if (corrupt) state.ledger.kodenTotal++;
			return state;
		},
	};
	return {
		client,
		calls,
		users,
		books,
		files,
		seed: () => {
			for (const u of plan.users) users.set(u.id, u);
			for (const k of plan.koudens) books.set(k.payload.koudenId, k.payload);
		},
	};
}

describe("prepare", () => {
	it("CLIの失敗時は安全な原因だけをstderrに表示し、終了コード1を返す", async () => {
		const dir = await temp();
		const input = snapshot();
		delete input.data["public.kouden_entries"];
		const source = join(dir, "source.json");
		const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
		const args = [cli, "prepare", "--source", source, "--out", join(dir, "prepared")];
		await writeFile(source, JSON.stringify(input));
		const missing = spawnSync("bun", args, { encoding: "utf8", timeout: 10_000 });
		expect(missing.status).toBe(1);
		expect(missing.stderr).toContain("snapshot_count:public.kouden_entries");
		expect(missing.stdout).toBe("");
		await writeFile(source, JSON.stringify({ private: "private@example.test" }));
		const invalid = spawnSync("bun", args, { encoding: "utf8", timeout: 10_000 });
		expect(invalid.status).toBe(1);
		expect(invalid.stderr).toBe(
			"移行CLIに失敗しました。引数・入力形式・保存先・認証設定を確認してください。\n",
		);
		expect(invalid.stdout).toBe("");
	});
	it("全台帳を変換し、元のJSONを変更しない", () => {
		const input = snapshot();
		const before = JSON.stringify(input);
		const result = prepareSnapshot(input);
		expect(result.plan.users).toHaveLength(1);
		expect(result.plan.koudens[0]?.payload.ledger.gifts).toHaveLength(1);
		expect(JSON.stringify(input)).toBe(before);
		expect(prepareSnapshot(input)).toEqual(result);
	});
	it("件数が欠けた抽出、割り当て先のない行、未対応の旧写真を止める", () => {
		const missing = snapshot();
		delete missing.data["public.kouden_entries"];
		expect(() => prepareSnapshot(missing)).toThrow("snapshot_count");
		const orphan = snapshot();
		orphan.data["public.koudens"] = [];
		orphan.row_counts["public.koudens"] = 0;
		expect(() => prepareSnapshot(orphan)).toThrow("unassigned_source");
		const photo = snapshot();
		photo.data["public.offering_photos"] = [{ id: "p1" }];
		photo.row_counts["public.offering_photos"] = 1;
		expect(() => prepareSnapshot(photo)).toThrow("unsupported:offering_photos");
	});
	it("必要な画像がなければ計画を作らず、保全済み画像はハッシュ付きでコピーする", async () => {
		const dir = await temp();
		const input = snapshot(true);
		await writeFile(join(dir, "source.json"), JSON.stringify(input));
		await expect(prepare(join(dir, "source.json"), join(dir, "prepared"))).rejects.toThrow(
			"missing:image_file_map",
		);
		const image = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		await writeFile(join(dir, "image.png"), image);
		await writeFile(
			join(dir, "files.json"),
			JSON.stringify([
				{ source: "https://source.example.test/private/image.png", path: "image.png" },
			]),
		);
		const plan = await prepare(
			join(dir, "source.json"),
			join(dir, "prepared"),
			join(dir, "files.json"),
		);
		expect(await loadPlan(join(dir, "prepared"))).toEqual(plan);
		expect(plan.koudens[0]?.files[0]).toMatchObject({ size: 8, sha256: digest(image) });
		const remote = fakeClient(plan);
		const result = await runMigration({
			mode: "import",
			plan,
			planDir: join(dir, "prepared"),
			reportDir: join(dir, "report"),
			client: remote.client,
		});
		expect(result.status).toBe("passed");
		expect(result.filesVerified).toBe(1);
		await writeFile(join(dir, "prepared", "files", `${digest(image)}.bin`), "changed");
		remote.calls.length = 0;
		const rejected = await runMigration({
			mode: "import",
			plan,
			planDir: join(dir, "prepared"),
			reportDir: join(dir, "rejected"),
			client: remote.client,
		});
		expect(rejected.error).toBe("local_file_checksum");
		expect(remote.calls).toEqual([]);
	});
});

describe("投入と読み戻し", () => {
	it("再投入しても増えず、verify は書き込みせずに照合する", async () => {
		const dir = await temp();
		const { plan } = prepareSnapshot(snapshot());
		const remote = fakeClient(plan);
		for (let run = 0; run < 2; run++) {
			const report = await runMigration({
				mode: "import",
				plan,
				planDir: dir,
				reportDir: join(dir, `run${run}`),
				client: remote.client,
			});
			expect(report.status).toBe("passed");
			expect(report.booksVerified).toBe(1);
		}
		expect(remote.books.size).toBe(1);
		remote.calls.length = 0;
		expect(
			(
				await runMigration({
					mode: "verify",
					plan,
					planDir: dir,
					reportDir: join(dir, "verify"),
					client: remote.client,
				})
			).status,
		).toBe("passed");
		expect(remote.calls.every((c) => c.method === "GET" || c.path.endsWith("users/verify"))).toBe(
			true,
		);
	});
	it("投入応答が成功でも金額差を見つけ、失敗レポートを保存する", async () => {
		const dir = await temp();
		const { plan } = prepareSnapshot(snapshot());
		const remote = fakeClient(plan, true);
		const next = structuredClone(plan.koudens[0]);
		if (!next) throw new Error("fixture");
		next.payload.koudenId = "next-book";
		next.payload.kouden.legacyKoudenId = "next-legacy-book";
		plan.koudens.push(next);
		const report = await runMigration({
			mode: "import",
			plan,
			planDir: dir,
			reportDir: dir,
			client: remote.client,
		});
		expect(report.status).toBe("failed");
		expect(report.booksVerified).toBe(0);
		expect(report.checks.flatMap((c) => c.differences)).toContain("ledger.kodenTotal");
		expect(report.measurements).toContainEqual({
			scope: plan.koudens[0]?.payload.koudenId,
			metric: "ledger.kodenTotal",
			expected: 10000,
			actual: 10001,
		});
		expect(remote.calls.filter((c) => c.method === "PUT")).toHaveLength(1);
		expect(JSON.parse(await readFile(join(dir, "report.json"), "utf8"))).toMatchObject({
			status: "failed",
		});
		expect(await readFile(join(dir, "report.md"), "utf8")).not.toContain("試験差出人");
	});
	it("200人を超えるユーザーを分割して全員照合する", async () => {
		const dir = await temp();
		const { plan } = prepareSnapshot(snapshot());
		const first = plan.users[0];
		if (!first) throw new Error("fixture");
		for (let i = 0; i < 200; i++)
			plan.users.push({ ...first, id: `user-${i}`, legacyUserId: `legacy-${i}`, googleSub: null });
		const remote = fakeClient(plan);
		const result = await runMigration({
			mode: "import",
			plan,
			planDir: dir,
			reportDir: dir,
			client: remote.client,
		});
		expect(result.status).toBe("passed");
		expect(result.usersVerified).toBe(201);
		expect(remote.calls.filter((c) => c.path === "/internal/import/users")).toHaveLength(2);
	});
	it("予定にない画像や移行済みユーザーがあれば合格にしない", async () => {
		const dir = await temp();
		const { plan } = prepareSnapshot(snapshot());
		const remote = fakeClient(plan);
		remote.seed();
		const book = plan.koudens[0];
		const user = plan.users[0];
		if (!book || !user) throw new Error("fixture");
		const key = `koudens/${book.payload.koudenId}/extra`;
		remote.files.set(key, { key, size: 1, sha256: "0".repeat(64) });
		const images = await runMigration({
			mode: "verify",
			plan,
			planDir: dir,
			reportDir: dir,
			client: remote.client,
		});
		expect(images.status).toBe("failed");
		remote.files.clear();
		remote.users.set("extra-user", { ...user, id: "extra-user" });
		const totals = await runMigration({
			mode: "verify",
			plan,
			planDir: dir,
			reportDir: dir,
			client: remote.client,
		});
		expect(totals.status).toBe("failed");
		expect(totals.checks.at(-1)?.scope).toBe("totals");
	});
	it.each(["private@example.test secret", "secret_token"])(
		"通信エラーの本文を保存しない (%#)",
		async (message) => {
			const dir = await temp();
			const { plan } = prepareSnapshot(snapshot());
			const client: ImportClient = {
				origin: "https://staging.example.test",
				request: async () => {
					throw new Error(message);
				},
			};
			const report = await runMigration({
				mode: "verify",
				plan,
				planDir: dir,
				reportDir: dir,
				client,
			});
			expect(report.error).toBe("migration_failed");
			expect(JSON.stringify(report)).not.toContain(message);
		},
	);
	it("ユーザーの不一致の場所を残し、台帳の処理へ進まない", async () => {
		const dir = await temp();
		const { plan } = prepareSnapshot(snapshot());
		const remote = fakeClient(plan);
		const request = remote.client.request;
		remote.client.request = async (path, ...args) =>
			path === "/internal/import/users/verify"
				? { checked: 1, differences: ["users[0].user.displayName"] }
				: request(path, ...args);
		const report = await runMigration({
			mode: "import",
			plan,
			planDir: dir,
			reportDir: dir,
			client: remote.client,
		});
		expect(report.status).toBe("failed");
		expect(report.checks).toContainEqual({
			scope: "users.batch1",
			differences: ["users[0].user.displayName"],
		});
		expect(remote.calls.filter((c) => c.method === "PUT")).toEqual([]);
	});
});

describe("HTTPクライアント", () => {
	it("一時的な503は再試行し、同じ認証を毎回付ける", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("", { status: 503 }))
			.mockResolvedValueOnce(Response.json({ ok: true }));
		const client = createImportClient(
			"https://staging.example.test",
			{ clientId: "id", clientSecret: "secret" },
			fetcher,
			async () => {},
		);
		expect(await client.request("/internal/import/summary")).toEqual({ ok: true });
		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(fetcher.mock.calls[1]?.[1]?.headers).toMatchObject({
			"CF-Access-Client-Secret": "secret",
		});
	});
	it.each([302, 403])("%iは再試行せず、リダイレクト先に秘密を送らない", async (status) => {
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
			new Response("private response", {
				status,
				headers: { location: "https://elsewhere.test" },
			}),
		);
		const client = createImportClient(
			"https://staging.example.test",
			{ clientId: "id", clientSecret: "secret" },
			fetcher,
		);
		await expect(client.request("/internal/import/summary")).rejects.toThrow(
			`import_http_${status}`,
		);
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher.mock.calls[0]?.[1]?.redirect).toBe("manual");
	});
	it("平文の外部接続・外部への開発トークン送信を拒否する", () => {
		expect(() =>
			createImportClient("http://example.test", { clientId: "id", clientSecret: "secret" }),
		).toThrow();
		expect(() => createImportClient("https://example.test", { devToken: "secret" })).toThrow();
	});
});
