"use server";

import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateKoudenParams, Kouden } from "@/types/kouden";

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
 * `koudens` INSERT は RPC `create_kouden_with_owner` を経由する。
 * `kouden_roles` / `kouden_members` は INSERT トリガが同一トランザクション内で
 * 作成するため、呼び出し元での待機 (旧 1秒 setTimeout) は不要。
 *
 * 注意: `userId` パラメータが渡された場合でも信用せず、必ずセッションから
 * 取得した auth.uid() を使用する (RPC 内でも `auth.uid()` を使用)。
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
		const supabase = await createClient();
		const adminSupabase = createAdminClient();

		// 香典帳作成: RPC で koudens INSERT を実行し、トリガで kouden_roles と
		// kouden_members が同一トランザクション内に作成されるのを待つ。
		// `plan_id` は RPC 内部で `code = 'free'` から解決される (クライアントから
		// 渡すと有料プラン ID を指定して悪用される脆弱性となるため受け取らない)。
		const { data: newKoudenId, error: rpcError } = await supabase.rpc("create_kouden_with_owner", {
			p_title: title,
			p_description: description ?? "",
		});

		if (rpcError || !newKoudenId) {
			throw rpcError ?? new Error("香典帳の作成に失敗しました");
		}

		// 作成した香典帳を取得
		const { data: kouden, error: koudenError } = await adminSupabase
			.from("koudens")
			.select("*")
			.eq("id", newKoudenId)
			.single();
		if (koudenError || !kouden) {
			throw koudenError ?? new Error("香典帳の取得に失敗しました");
		}

		// オーナーのプロフィール取得は best-effort: ここで失敗しても香典帳は既に
		// 作成済みなのでエラー返却はしない (ユーザー再試行による重複作成を防ぐ)。
		const { data: owner, error: ownerError } = await adminSupabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", userId)
			.single();
		if (ownerError) {
			logger.warn(
				{ userId, koudenId: newKoudenId, error: ownerError.message },
				"Owner profile fetch failed after kouden creation; continuing with fallback",
			);
		}

		return {
			kouden: {
				...kouden,
				owner: owner ?? { id: userId, display_name: null },
			} as unknown as Kouden,
		};
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
