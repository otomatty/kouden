"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * プランアップグレード後の処理
 *
 * koudens.plan_id の UPDATE と kouden_purchases への INSERT を
 * `update_kouden_plan` RPC で 1 トランザクションに閉じる (issue #114)。
 */
export async function updateKoudenPlan({
	koudenId,
	newPlanCode,
}: {
	koudenId: string;
	newPlanCode: string;
}): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error: rpcError } = await supabase.rpc("update_kouden_plan", {
			p_kouden_id: koudenId,
			p_new_plan_code: newPlanCode,
		});
		if (rpcError) throw rpcError;
		return null;
	}, "プラン変更");
}
