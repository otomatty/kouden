import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { exportedFixture, sourceFixture } from "./rollback-fixture.ts";

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
		await writeFile(sourcePath, JSON.stringify(source));
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
