import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { digest, prepare } from "../src/prepare.ts";
import { exportedFixture, relationshipFixture, sourceFixture } from "./rollback-fixture.ts";

it.each(["relationship"] as const)(
	"refuses %s conflicts in plan, apply and verify before emitting SQL or connecting",
	async () => {
		const dir = await mkdtemp(join(tmpdir(), "kouden-rollback-owner-"));
		if (!dir.startsWith(join(tmpdir(), "kouden-rollback-owner-")))
			throw new Error("invalid_test_directory");
		const { source, current } = relationshipFixture();
		const [first, second] = current.ledgers[0]!.tables.relationships;
		first!.name = second!.name;
		const blockers = source.data["public.relationships"]!.map((r) => ({
			code: "legacy_relationship_name_conflict",
			entityId: r.id,
			field: "name",
		}));
		const cli = fileURLToPath(new URL("../src/rollback-cli.ts", import.meta.url));
		try {
			const sourcePath = join(dir, "source.json");
			const snapshotPath = join(dir, "v2.json");
			await writeFile(sourcePath, JSON.stringify(source));
			await writeFile(snapshotPath, JSON.stringify(current));
			for (const command of ["plan", "apply", "verify"]) {
				const out = join(dir, command);
				const args = [
					cli,
					command,
					"--source",
					sourcePath,
					"--snapshot",
					snapshotPath,
					"--out",
					out,
				];
				if (command !== "plan") args.push("--project-ref", source.project_ref, "--writes-stopped");
				const result = spawnSync("bun", args, {
					encoding: "utf8",
					timeout: 10000,
					windowsHide: true,
					env: { ...process.env, PGHOST: "", PGPASSWORD: "" },
				});
				expect(result.status).toBe(1);
				expect(result.stderr).toBe("");
				const report = JSON.parse(await readFile(join(out, "report.json"), "utf8"));
				expect(report.status).toBe("blocked");
				expect(report.blockers).toEqual(blockers);
				for (const file of ["apply.sql", "verify.sql"])
					await expect(readFile(join(out, file))).rejects.toMatchObject({ code: "ENOENT" });
			}
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	},
);

it("plans offline, refuses unapproved apply and does not print private input", async () => {
	const dir = await mkdtemp(join(tmpdir(), "kouden-rollback-"));
	if (!dir.startsWith(join(tmpdir(), "kouden-rollback-")))
		throw new Error("invalid_test_directory");
	const source = sourceFixture();
	const current = exportedFixture(source);
	current.ledgers[0]!.tables.gifts[0]!.amount = 20000;
	const sourcePath = join(dir, "source.json");
	const snapshotPath = join(dir, "v2.json");
	const cli = fileURLToPath(new URL("../src/rollback-cli.ts", import.meta.url));
	try {
		const sourceRaw = `${JSON.stringify(source, null, 2)}\r\n`;
		await writeFile(sourcePath, sourceRaw);
		await writeFile(snapshotPath, JSON.stringify(current));
		const args = ["--source", sourcePath, "--snapshot", snapshotPath];
		const plan = spawnSync("bun", [cli, "plan", ...args, "--out", join(dir, "plan")], {
			encoding: "utf8",
			timeout: 10000,
			windowsHide: true,
		});
		expect(plan.status).toBe(0);
		expect(plan.stdout).toContain("SHA256");
		expect(plan.stdout).not.toContain("差出人");
		const report = JSON.parse(await readFile(join(dir, "plan", "report.json"), "utf8"));
		expect(report.status).toBe("ready");
		const forward = await prepare(sourcePath, join(dir, "forward"));
		expect(report.sourceSha256).toBe(digest(sourceRaw));
		expect(report.sourceSha256).toBe(forward.sourceSha256);
		const rejected = spawnSync(
			"bun",
			[
				cli,
				"apply",
				...args,
				"--project-ref",
				source.project_ref,
				"--writes-stopped",
				"--approve-sha256",
				"wrong",
				"--out",
				join(dir, "apply"),
			],
			{ encoding: "utf8", timeout: 10000, windowsHide: true },
		);
		expect(rejected.status).toBe(1);
		expect(rejected.stderr).toContain("rollback_approval_mismatch");
		expect(JSON.parse(await readFile(join(dir, "apply", "report.json"), "utf8")).status).toBe(
			"failed",
		);
		current.ledgers[0]!.tables.persons[0]!.notes = "差出人のメモ";
		await writeFile(snapshotPath, JSON.stringify(current));
		const blocked = spawnSync("bun", [cli, "plan", ...args, "--out", join(dir, "blocked")], {
			encoding: "utf8",
			timeout: 10000,
			windowsHide: true,
		});
		expect(blocked.status).toBe(1);
		const blockedReport = JSON.parse(await readFile(join(dir, "blocked", "report.json"), "utf8"));
		expect(blockedReport.status).toBe("blocked");
		expect(blockedReport.blockers).toContainEqual({
			code: "unrepresentable_field",
			entityId: current.ledgers[0]!.tables.persons[0]!.id,
			field: "notes",
		});
		await expect(readFile(join(dir, "blocked", "apply.sql"))).rejects.toMatchObject({
			code: "ENOENT",
		});
		await writeFile(snapshotPath, '{"private":"SECRET-PERSON"}');
		const invalid = spawnSync("bun", [cli, "plan", ...args, "--out", join(dir, "bad")], {
			encoding: "utf8",
			timeout: 10000,
			windowsHide: true,
		});
		expect(invalid.status).toBe(1);
		expect(invalid.stderr + invalid.stdout).not.toContain("SECRET-PERSON");
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

it("passes --user-map to plan and rejects an invalid map without printing it", async () => {
	const dir = await mkdtemp(join(tmpdir(), "kouden-rollback-map-"));
	if (!dir.startsWith(join(tmpdir(), "kouden-rollback-map-")))
		throw new Error("invalid_test_directory");
	const source = sourceFixture();
	const current = exportedFixture(source);
	current.manifest.users.push({
		id: "v2-only",
		legacy_user_id: null,
		display_name: "新規",
		created_at: source.extracted_at,
		deleted_at: null,
	});
	const cli = fileURLToPath(new URL("../src/rollback-cli.ts", import.meta.url));
	try {
		const paths = ["source", "v2", "map", "bad"].map((n) => join(dir, `${n}.json`));
		await writeFile(paths[0]!, JSON.stringify(source));
		await writeFile(paths[1]!, JSON.stringify(current));
		await writeFile(
			paths[2]!,
			JSON.stringify([
				{ v2UserId: "v2-only", legacyUserId: "10000000-0000-4000-8000-0000000000aa" },
			]),
		);
		await writeFile(paths[3]!, JSON.stringify([{ v2UserId: "SECRET-PERSON", legacyUserId: "x" }]));
		const run = (map: string, out: string) =>
			spawnSync(
				"bun",
				[
					cli,
					"plan",
					"--source",
					paths[0]!,
					"--snapshot",
					paths[1]!,
					"--user-map",
					map,
					"--out",
					join(dir, out),
				],
				{ encoding: "utf8", timeout: 10000, windowsHide: true },
			);
		expect(run(paths[2]!, "ok").status).toBe(0);
		const report = JSON.parse(await readFile(join(dir, "ok", "report.json"), "utf8"));
		expect(report.notices).toEqual([
			{
				code: "new_user_mapped",
				entityId: "v2-only",
				legacyUserId: "10000000-0000-4000-8000-0000000000aa",
			},
		]);
		const bad = run(paths[3]!, "bad");
		expect(bad.status).toBe(1);
		expect(bad.stderr).toContain("rollback_user_map_invalid");
		expect(bad.stderr + bad.stdout).not.toContain("SECRET-PERSON");
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
