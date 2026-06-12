"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { requireKoudenOwner } from "../permissions";

/**
 * 香典帳を削除する。
 *
 * @param id 削除対象の香典帳 ID
 * @returns 成功時 `{ ok: true, data: null }` / 失敗時 `{ ok: false, error }`
 */
export async function deleteKouden(id: string): Promise<ActionResult<null>> {
	try {
		return await withActionResult(async () => {
			await requireKoudenOwner(id, "削除権限がありません");

			const supabase = createAdminClient();
			const { error } = await supabase.from("koudens").delete().eq("id", id);
			if (error) throw error;

			return null;
		}, "香典帳の削除");
	} finally {
		// 成否に関わらず、キャッシュ再検証は必ず行う
		revalidatePath(`/koudens/${id}`);
		revalidatePath("/koudens");
	}
}
