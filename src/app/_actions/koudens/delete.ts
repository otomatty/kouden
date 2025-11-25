"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDeleteKouden } from "../permissions";
import logger from "@/lib/logger";

/**
 * 香典帳の削除
 */
export async function deleteKouden(id: string) {
	try {
		const hasPermission = await canDeleteKouden(id);
		if (!hasPermission) {
			logger.error({ koudenId: id }, "[deleteKouden] permission denied");
			return; // 権限不足時は例外を投げずに終了
		}

		const supabase = createAdminClient();
		const { error } = await supabase.from("koudens").delete().eq("id", id);
		if (error) {
			logger.error(
				{
					error: error.message,
					code: error.code,
					koudenId: id,
				},
				"[deleteKouden] supabase delete error",
			);
			return; // 削除エラー時も例外を投げずに終了
		}
	} catch (err) {
		logger.error(
			{
				error: err instanceof Error ? err.message : String(err),
				koudenId: id,
			},
			"[deleteKouden] suppressed error",
		);
		// 例外を抑制してUI側に伝播させない
	} finally {
		// キャッシュ再検証は必ず行う
		revalidatePath(`/koudens/${id}`);
		revalidatePath("/koudens");
	}
}
