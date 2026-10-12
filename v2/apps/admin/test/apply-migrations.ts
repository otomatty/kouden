import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach } from "vitest";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

beforeEach(async () => {
	await env.DB.batch([
		env.DB.prepare("DELETE FROM admin_audit_logs"),
		env.DB.prepare("DELETE FROM purchases"),
		env.DB.prepare("DELETE FROM invitations"),
		env.DB.prepare("DELETE FROM ownership_transfers"),
		env.DB.prepare("DELETE FROM kouden_stats"),
		env.DB.prepare("DELETE FROM kouden_members"),
		env.DB.prepare("DELETE FROM koudens"),
		env.DB.prepare("DELETE FROM sessions"),
		env.DB.prepare("DELETE FROM legacy_users"),
		env.DB.prepare("DELETE FROM users"),
	]);
});
