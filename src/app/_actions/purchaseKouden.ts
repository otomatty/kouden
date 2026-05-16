"use server";

import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calcSupportFee } from "@/utils/calcSupportFee";
import Stripe from "stripe";

/**
 * Stripe Checkout セッション生成
 */
export async function purchaseKouden({
	koudenId,
	planCode,
	expectedCount,
	title = "",
	description = "",
	cancelPath = "/koudens",
}: {
	koudenId: string;
	planCode: string;
	expectedCount?: number;
	title?: string;
	description?: string;
	cancelPath?: string;
}): Promise<{ url?: string; sessionId?: string; error?: string }> {
	try {
		const supabase = createAdminClient();
		// ユーザー取得（認証チェック・所有者チェック・metadata用）
		const supabaseClient = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabaseClient.auth.getUser();
		if (userError || !user) {
			logger.error(
				{
					error: userError?.message,
				},
				"[ERROR] ユーザー取得失敗",
			);
			return { error: "認証が必要です" };
		}
		const userId = user.id;
		const userEmail = user.email;
		// プラン取得（IDと価格）
		const { data: plan, error: planError } = await supabase
			.from("plans")
			.select("id, price, name")
			.eq("code", planCode)
			.single();
		if (planError || !plan) {
			return { error: "プランが見つかりません" };
		}
		// 既存のプラン価格取得（アップグレード時の差額計算用）兼 所有者チェック
		const { data: existingKouden, error: existingKoudenError } = await supabase
			.from("koudens")
			.select("plan_id, owner_id, created_by")
			.eq("id", koudenId)
			.maybeSingle();
		// 不正な UUID や DB エラーで所有者チェックを fail-open させない
		if (existingKoudenError) {
			logger.error(
				{
					userId,
					koudenId,
					error: existingKoudenError.message,
					code: existingKoudenError.code,
				},
				"[ERROR] purchaseKouden: 香典帳取得失敗",
			);
			return { error: "香典帳の取得に失敗しました" };
		}
		// 既存の香典帳の場合は所有者チェックを実施（新規作成フローでは存在しない）
		if (existingKouden) {
			const isOwner = existingKouden.owner_id === userId || existingKouden.created_by === userId;
			if (!isOwner) {
				logger.warn(
					{
						userId,
						koudenId,
						planCode,
					},
					"[WARN] purchaseKouden: 所有者でないユーザーがアクセスを試みました",
				);
				return { error: "この香典帳を操作する権限がありません" };
			}
		}
		let currentPrice = 0;
		if (existingKouden?.plan_id) {
			const { data: cp } = await supabase
				.from("plans")
				.select("price")
				.eq("id", existingKouden.plan_id)
				.single();
			currentPrice = cp?.price || 0;
		}
		// ダウングレード・同額プランへの変更は二重支払いになるためブロック
		if (existingKouden && currentPrice > 0 && plan.price <= currentPrice) {
			logger.warn(
				{
					userId,
					koudenId,
					planCode,
					planPrice: plan.price,
					currentPrice,
				},
				"[WARN] purchaseKouden: ダウングレード/同額プランへの変更は許可されていません",
			);
			return { error: "現在のプランと同額または下位のプランには変更できません" };
		}
		// Retrieve Stripe secret key safely and initialize
		const stripeSecret = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecret) {
			logger.error({}, "[ERROR] STRIPE_SECRET_KEY is not set");
			return { error: "支払いセッションの生成に失敗しました" };
		}
		// FIRST_EDIT: 開発環境では環境変数STRIPE_API_VERSIONを使い、それ以外は既存バージョンを使用
		const stripeApiVersion = (
			process.env.NODE_ENV === "development" && process.env.STRIPE_API_VERSION
				? process.env.STRIPE_API_VERSION
				: "2025-05-28.basil"
		) as Stripe.StripeConfig["apiVersion"];
		const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });
		// 決済金額の算出
		let amount = plan.price;
		if (planCode === "premium_full_support" && typeof expectedCount === "number") {
			amount = calcSupportFee(expectedCount, plan.price);
		}
		// 既存有料プランからのアップグレード時は差額のみ請求
		if (currentPrice > 0) {
			amount = amount - currentPrice;
		}
		// 金額の妥当性チェック（差額計算で負になる/NaN/Stripe JPY 最小額 50 円未満を弾く）
		if (!(amount >= 50)) {
			logger.warn(
				{
					userId,
					koudenId,
					planCode,
					amount,
					currentPrice,
					planPrice: plan.price,
				},
				"[WARN] purchaseKouden: 決済金額が不正です",
			);
			return { error: "決済金額が不正です" };
		}
		// 開発環境ではリダイレクト先をローカルホストに設定
		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8788"
				: process.env.NEXT_PUBLIC_APP_URL;
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			customer_email: userEmail,
			line_items: [
				{
					price_data: {
						currency: "jpy",
						product_data: {
							name: `${plan.name}プラン`,
						},
						unit_amount: amount,
					},
					quantity: 1,
				},
			],
			mode: "payment",
			success_url: `${baseUrl}/koudens/${koudenId}/entries`,
			cancel_url: `${baseUrl}${cancelPath}`,
			metadata: {
				koudenId,
				planCode,
				userId,
				expectedCount: expectedCount?.toString() || "",
				title,
				description,
			},
		});
		return { url: session.url || undefined, sessionId: session.id };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				koudenId,
				planCode,
			},
			"[ERROR] Error creating Stripe session",
		);
		return { error: "支払いセッションの生成に失敗しました" };
	}
}
