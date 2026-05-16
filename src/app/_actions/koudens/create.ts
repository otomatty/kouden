"use server";

import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateKoudenParams, Kouden } from "@/types/kouden";
import { KOUDEN_ROLES } from "@/types/role";

export interface CreateKoudenWithPlanParams extends Omit<CreateKoudenParams, "userId"> {
	planCode: string;
	expectedCount?: number;
}

/**
 * 認証済みユーザーIDを取得する内部ヘルパー。
 * service-role の admin client では `auth.getUser()` がセッションを持たないため、
 * 必ず通常の server client から取得する。クライアントから渡された userId は信用しない。
 */
async function getAuthenticatedUserId(): Promise<string | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user?.id ?? null;
}

/**
 * 香典帳の作成
 *
 * 注意: `userId` パラメータが渡された場合でも信用せず、必ずセッションから
 * 取得した auth.uid() を使用する。
 */
export async function createKouden({
	title,
	description,
}: Omit<CreateKoudenParams, "userId">): Promise<{ kouden?: Kouden; error?: string }> {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return { error: "認証が必要です" };
	}

	try {
		const supabase = createAdminClient();

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
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				title,
				userId,
			},
			"Error creating kouden",
		);
		return { error: "香典帳の作成に失敗しました" };
	}
}

/**
 * 無料プラン付き香典帳作成（クライアントから直接呼び出される唯一の経路）
 *
 * セキュリティ要件:
 * - `planCode` は `"free"` のみ許可。有料プランの作成は `purchaseKouden`
 *   → Stripe Webhook の経路でのみ可能（決済済みの事実を Stripe 署名で検証）。
 * - `userId` パラメータは受け取らず、必ずセッションから取得する。
 */
export async function createKoudenWithPlan({
	title,
	description,
	planCode,
	expectedCount,
}: CreateKoudenWithPlanParams): Promise<{ koudenId?: string; error?: string }> {
	const uid = await getAuthenticatedUserId();
	if (!uid) {
		return { error: "認証が必要です" };
	}

	// 有料プランの場合はこの経路を許可しない（Stripe Webhook 経由のみ）。
	if (planCode !== "free") {
		logger.warn(
			{ planCode, userId: uid },
			"createKoudenWithPlan called with non-free planCode; rejecting",
		);
		return { error: "有料プランは決済フローからのみ作成できます" };
	}

	try {
		const supabase = createAdminClient();
		// プラン取得（IDと価格）
		const { data: plan, error: planError } = await supabase
			.from("plans")
			.select("id, price, code")
			.eq("code", planCode)
			.single();
		if (planError || !plan) {
			return { error: "プランが見つかりません" };
		}
		// 念のため price の0円も確認しておく（DB側で free が誤って課金プランに変わるのを防ぐ）
		if (plan.code !== "free" || (plan.price ?? 0) !== 0) {
			logger.error(
				{ planCode, planPrice: plan.price, planDbCode: plan.code, userId: uid },
				"createKoudenWithPlan: plan integrity check failed (expected free / price 0)",
			);
			return { error: "プラン整合性エラー" };
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
		// 購入履歴作成（無料プランは amount_paid=0）
		const { error: purchaseError } = await supabase.from("kouden_purchases").insert({
			kouden_id: kouden.id,
			user_id: uid,
			plan_id: plan.id,
			expected_count: expectedCount,
			amount_paid: 0,
		});
		if (purchaseError) {
			throw purchaseError;
		}
		return { koudenId: kouden.id };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				title,
				planCode,
				userId: uid,
			},
			"Error creating kouden with plan",
		);
		return { error: "有料香典帳の作成に失敗しました" };
	}
}
