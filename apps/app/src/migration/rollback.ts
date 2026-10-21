/** 切り戻し用。認証情報・セッション・Google の識別子は出力しない。 */
export async function rollbackManifest(db: D1Database) {
	const queries = {
		users: "SELECT id, legacy_user_id, display_name, created_at, deleted_at FROM users ORDER BY id",
		koudens: "SELECT * FROM koudens ORDER BY id",
		members: "SELECT * FROM kouden_members ORDER BY kouden_id, user_id",
		purchases: "SELECT * FROM purchases ORDER BY id",
	};
	const names = Object.keys(queries) as (keyof typeof queries)[];
	const results = await db.batch(names.map((name) => db.prepare(queries[name])));
	return Object.fromEntries(names.map((name, index) => [name, results[index]!.results]));
}
