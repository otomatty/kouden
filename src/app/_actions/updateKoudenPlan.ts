"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * プランアップグレード後の処理
 */
export async function updateKoudenPlan({
	koudenId,
	newPlanCode,
	currentPlanCode,
}: {
	koudenId: string;
	newPlanCode: string;
	currentPlanCode?: string;
}): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		// 認証ユーザー取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}
		// 新プラン取得
		const { data: newPlan, error: newPlanError } = await supabase
			.from("plans")
			.select("id, price")
			.eq("code", newPlanCode)
			.single();
		if (newPlanError || !newPlan) {
			throw new KoudenError("新プランが見つかりません", ErrorCodes.NOT_FOUND);
		}
		// 現行プラン価格取得
		let currentPrice = 0;
		if (currentPlanCode) {
			const { data: currentPlan } = await supabase
				.from("plans")
				.select("price")
				.eq("code", currentPlanCode)
				.single();
			currentPrice = currentPlan?.price ?? 0;
		}
		const amount = newPlan.price - currentPrice;
		// 香典帳更新
		const { error: koudenError } = await supabase
			.from("koudens")
			.update({ plan_id: newPlan.id })
			.eq("id", koudenId);
		if (koudenError) throw koudenError;
		// 購入履歴挿入
		const { error: purchaseError } = await supabase.from("kouden_purchases").insert({
			kouden_id: koudenId,
			user_id: user.id,
			plan_id: newPlan.id,
			amount_paid: amount,
		});
		if (purchaseError) throw purchaseError;
		return null;
	}, "プラン変更");
}
