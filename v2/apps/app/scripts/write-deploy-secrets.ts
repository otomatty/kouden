/** GitHub Actions 用。無効な機能の秘密を渡して、設定の空値を上書きしない。 */
import { writeFileSync } from "node:fs";
import { MODES, resolveMode } from "../deploy.settings.ts";

const mode = resolveMode(process.env.MODE);
if (mode === "development") throw new Error("A deployment mode is required");
const output = process.argv[2];
if (!output) throw new Error("A secrets file path is required");
const names = ["GOOGLE_CLIENT_SECRET", "SESSION_SECRET"];
if (MODES[mode].billingEnabled) names.push("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
const secrets: Record<string, string> = {};
for (const name of names) {
	const value = process.env[name];
	if (!value) throw new Error(`Missing deployment secret: ${name}`);
	secrets[name] = value;
}
writeFileSync(output, JSON.stringify(secrets), { mode: 0o600, flag: "wx" });
