import { deleteExpiredSessions } from "./auth/session-store.ts";
import { cleanupMembership } from "./kouden/members.ts";
import { finishDeletion, listDeletingKoudens } from "./kouden/store.ts";
import { ledgerFor } from "./ledger/client.ts";
import { log } from "./lib/logger.ts";

/** 日次の Cron（03:00 JST）。期限切れデータの掃除と、途中で止まった香典帳の削除の再処理 */
export async function runDailyMaintenance(env: Env, now: Date): Promise<void> {
	const deletedSessions = await deleteExpiredSessions(env.DB, now);
	const membership = await cleanupMembership(env.DB, now);

	let deletedKoudens = 0;
	for (const koudenId of await listDeletingKoudens(env.DB)) {
		try {
			await finishDeletion(env, koudenId, (id) => ledgerFor(env, id).deleteAll());
			deletedKoudens += 1;
		} catch (err) {
			log("error", "kouden_deletion_retry_failed", {
				koudenId,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
	log("info", "daily_maintenance", { deletedSessions, deletedKoudens, ...membership });
}
