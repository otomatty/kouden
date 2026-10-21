/**
 * デプロイ前に、deploy.settings.ts に仮の値が残っていないかを検査する。
 *
 *   bun run check:deploy -- --mode staging
 */
import { parseArgs } from "node:util";
import { deployBlockers, resolveMode } from "../deploy.settings.ts";

const { values } = parseArgs({ options: { mode: { type: "string" } } });
const blockers = deployBlockers(resolveMode(values.mode));
if (blockers.length > 0) {
	for (const b of blockers) console.error(`✗ ${b}`);
	process.exit(1);
}
console.info("deploy settings OK");
