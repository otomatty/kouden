/**
 * 運営者画面のデプロイ。仮の値の検査 → CSS の生成 → `cf deploy` の順に実行する。
 *
 *   bun run deploy -- --mode staging
 */
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { deployBlockers, resolveMode } from "../deploy.settings.ts";

const args = process.argv.slice(2);
const { values } = parseArgs({ args, options: { mode: { type: "string" } }, strict: false });
const mode = resolveMode(typeof values.mode === "string" ? values.mode : undefined);

const blockers = deployBlockers(mode);
if (blockers.length > 0) {
	for (const b of blockers) console.error(`✗ ${b}`);
	process.exit(1);
}

function run(cmd: string, cmdArgs: string[]): void {
	const res = spawnSync(cmd, cmdArgs, { stdio: "inherit" });
	if (res.status !== 0) process.exit(res.status ?? 1);
}

run("bun", ["run", "css"]);
run("cf", ["deploy", ...args]);
