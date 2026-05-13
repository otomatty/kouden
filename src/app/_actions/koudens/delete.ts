"use server";

import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { canDeleteKouden } from "../permissions";

export type DeleteKoudenResult = { success: true } | { success: false; error: string };

/**
 * 香典帳の削除
 * @param id - 削除対象の香典帳のID
 * @returns `{ success: true }` または `{ success: false, error }`
 */
export async function deleteKouden(id: string): Promise<DeleteKoudenResult> {
	try {
		const hasPermission = await canDeleteKouden(id);
		if (!hasPermission) {
			logger.error({ koudenId: id }, "[deleteKouden] permission denied");
			return { success: false, error: "削除権限がありません" };
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
			return { success: false, error: "削除に失敗しました" };
		}

		return { success: true };
	} catch (err) {
		logger.error(
			{
				error: err instanceof Error ? err.message : String(err),
				koudenId: id,
			},
			"[deleteKouden] suppressed error",
		);
		return { success: false, error: "削除に失敗しました" };
	} finally {
		// キャッシュ再検証は必ず行う
		revalidatePath(`/koudens/${id}`);
		revalidatePath("/koudens");
	}
}
