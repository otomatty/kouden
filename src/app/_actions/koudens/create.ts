"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateKoudenParams, Kouden } from "@/types/kouden";
import { KOUDEN_ROLES } from "@/types/role";

export interface CreateKoudenWithPlanParams extends CreateKoudenParams {
	planCode: string;
	expectedCount?: number;
}

/**
 * 香典帳の作成
 */
export async function createKouden({
	title,
	description,
	userId,
}: CreateKoudenParams): Promise<{ kouden?: Kouden; error?: string }> {
	try {
		const supabase = await createAdminClient();

		// ユーザーIDが渡されていない場合は現在のユーザーのIDを使用
		if (!userId) {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				return { error: "認証が必要です" };
			}
			userId = user.id;
		}

		// freeプランIDを取得
		const { data: freePlan, error: freePlanError } = await supabase
			.from("plans")
			.select("id")
			.eq("code", "free")
			.single();
		if (freePlanError || !freePlan) {
			throw new Error("プランの取得に失敗しました");
		}

		// 香典帳を作成
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.insert({ title, description, owner_id: userId, created_by: userId, plan_id: freePlan.id })
			.select("*")
			.single();

		if (koudenError) {
			throw koudenError;
		}

		// オーナー情報を取得
		const { data: owner, error: ownerError } = await supabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", userId)
			.single();

		if (ownerError) {
			throw ownerError;
		}

		// 初期関係性を待機
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// 編集者ロールを取得
		const { data: ownerRole, error: roleError } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", kouden.id)
			.eq("name", KOUDEN_ROLES.EDITOR)
			.single();

		if (!ownerRole || roleError) {
			throw new Error("編集者ロールの取得に失敗しました");
		}

		// メンバーとして登録
		const { error: memberError } = await supabase
			.from("kouden_members")
			.insert({ kouden_id: kouden.id, user_id: userId, role_id: ownerRole.id, added_by: userId });

		if (memberError) {
			throw memberError;
		}

		return { kouden: { ...kouden, owner } as unknown as Kouden };
	} catch (error) {
		console.error("[ERROR] Error creating kouden:", error);
		return { error: "香典帳の作成に失敗しました" };
	}
}

/**
 * 有料プラン付き香典帳作成
 */
export async function createKoudenWithPlan({
	title,
	description,
	userId,
	planCode,
	expectedCount,
}: CreateKoudenWithPlanParams): Promise<{ koudenId?: string; error?: string }> {
	try {
		const supabase = createAdminClient();
		let uid = userId;
		if (!uid) {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			if (userError || !user) {
				return { error: "認証が必要です" };
			}
			uid = user.id;
		}
		// プラン取得（IDと価格）
		const { data: plan, error: planError } = await supabase
			.from("plans")
			.select("id, price")
			.eq("code", planCode)
			.single();
		if (planError || !plan) {
			return { error: "プランが見つかりません" };
		}
		// 香典帳作成
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.insert({ title, description, owner_id: uid, created_by: uid, plan_id: plan.id })
			.select("id")
			.single();
		if (koudenError || !kouden) {
			throw koudenError;
		}
		// 購入履歴作成
		const amountPaid = plan.price;
		const { error: purchaseError } = await supabase.from("kouden_purchases").insert({
			kouden_id: kouden.id,
			user_id: uid,
			plan_id: plan.id,
			expected_count: expectedCount,
			amount_paid: amountPaid,
		});
		if (purchaseError) {
			throw purchaseError;
		}
		return { koudenId: kouden.id };
	} catch (error) {
		console.error("[ERROR] Error creating kouden with plan:", error);
		return { error: "有料香典帳の作成に失敗しました" };
	}
}
