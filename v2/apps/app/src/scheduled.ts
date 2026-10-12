import { deleteExpiredSessions } from "./auth/session-store.ts";
import { log } from "./lib/logger.ts";

/** 日次の Cron（03:00 JST）。期限切れデータの掃除を行う */
export async function runDailyMaintenance(env: Env, now: Date): Promise<void> {
	const deleted = await deleteExpiredSessions(env.DB, now);
	log("info", "daily_maintenance", { deletedSessions: deleted });
}
