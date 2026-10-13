import { importKoudenPayloadSchema, importUsersPayloadSchema } from "@kouden/domain";
import { type Context, Hono } from "hono";
import { log } from "../lib/logger.ts";
import { ledgerFor } from "../ledger/client.ts";
import { importAuth } from "../migration/auth.ts";
import {
	importKoudenRows,
	importUsers,
	koudenImportState,
	koudenRowsBefore,
	restoreKoudenRows,
} from "../migration/store.ts";
import type { AppDeps, AppEnv } from "../types.ts";

/**
 * 旧アプリからのデータ移行の取り込み口（05 §2）。移行ツール（tools/migrate-from-supabase）だけが呼ぶ。
 * 順序: ユーザー → 香典帳ごと（D1 の行 → 台帳の DO）。どれも何度呼んでも同じ結果になる
 */
export function internalRoutes(deps: AppDeps) {
	const r = new Hono<AppEnv>();
	r.use("/internal/*", importAuth(deps));

	r.post("/internal/import/users", async (c) => {
		const parsed = importUsersPayloadSchema.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) return c.json({ error: "invalid", issues: parsed.error.issues }, 400);
		try {
			await importUsers(c.env.DB, parsed.data.users, c.get("now").toISOString());
		} catch (err) {
			// 取り込み前に同じ Google アカウントで登録した人がいる（google_sub の一意制約）など。まとめて書くので何も変わらない
			return failed(c, "users_import_failed", err);
		}
		log("info", "import_users", { count: parsed.data.users.length });
		return c.json({ imported: parsed.data.users.length });
	});

	r.put("/internal/import/koudens/:koudenId", async (c) => {
		const koudenId = c.req.param("koudenId");
		const parsed = importKoudenPayloadSchema.safeParse(await c.req.json().catch(() => null));
		if (!parsed.success) return c.json({ error: "invalid", issues: parsed.error.issues }, 400);
		// 移行ツールの対応づけの誤りで、別の香典帳の ID に書き込まないようにする
		if (parsed.data.koudenId !== koudenId) {
			return c.json(
				{ error: "kouden_id_mismatch", message: `payload is for ${parsed.data.koudenId}` },
				400,
			);
		}
		const { kouden, members, purchases, ledger } = parsed.data;
		const at = c.get("now").toISOString();
		// 統計の投影先になるので、D1 の行を先に作る。台帳の取り込みに失敗したら取り込み前に戻す
		const before = await koudenRowsBefore(c.env.DB, koudenId);
		try {
			await importKoudenRows(c.env.DB, koudenId, { kouden, members, purchases }, at);
		} catch (err) {
			// メンバーのユーザーが未登録（先に users を取り込んでいない）など
			return failed(c, "kouden_import_failed", err, koudenId);
		}
		try {
			const summary = await ledgerFor(c.env, koudenId).importSnapshot(koudenId, ledger, at);
			log("info", "import_kouden", { koudenId, persons: summary.persons });
			return c.json({ koudenId, ledger: summary });
		} catch (err) {
			// 台帳は 1 トランザクションで入れ直すので、失敗しても前回の取り込み結果のまま。D1 の行も戻す
			try {
				await restoreKoudenRows(c.env.DB, koudenId, before);
			} catch (restoreErr) {
				log("error", "kouden_import_restore_failed", {
					koudenId,
					error: restoreErr instanceof Error ? restoreErr.message : String(restoreErr),
				});
			}
			return failed(c, "ledger_import_failed", err, koudenId);
		}
	});

	r.get("/internal/import/koudens/:koudenId", async (c) => {
		const koudenId = c.req.param("koudenId");
		const d1 = await koudenImportState(c.env.DB, koudenId);
		if (!d1) return c.json({ error: "not_found" }, 404);
		const ledger = await ledgerFor(c.env, koudenId).importSummary();
		return c.json({ koudenId, d1, ledger });
	});

	return r;
}

/** 失敗の理由を移行ツールに返す（画面ではないので HTML のエラーページにしない） */
function failed(c: Context<AppEnv>, error: string, err: unknown, koudenId?: string) {
	const message = err instanceof Error ? err.message : String(err);
	log("error", error, { koudenId, error: message });
	return c.json({ error, message }, 500);
}
