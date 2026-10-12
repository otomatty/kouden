import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach } from "vitest";

// ストレージはテストファイル単位で分離される。マイグレーションはファイルごとに 1 回適用する
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// 同じファイル内のテスト同士が干渉しないよう、各テストの前にデータを消す
beforeEach(async () => {
	await env.DB.batch([
		env.DB.prepare("DELETE FROM sessions"),
		env.DB.prepare("DELETE FROM legacy_users"),
		env.DB.prepare("DELETE FROM users"),
	]);
});
