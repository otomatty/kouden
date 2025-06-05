"use server";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calcSupportFee } from "@/utils/calcSupportFee";

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
		// プラン取得（IDと価格）
		const { data: plan, error: planError } = await supabase
			.from("plans")
			.select("id, price, name")
			.eq("code", planCode)
			.single();
		if (planError || !plan) {
			return { error: "プランが見つかりません" };
		}
		// 既存のプラン価格取得（アップグレード時の差額計算用）
		const { data: existingKouden } = await supabase
			.from("koudens")
			.select("plan_id")
			.eq("id", koudenId)
			.single();
		let currentPrice = 0;
		if (existingKouden?.plan_id) {
			const { data: cp } = await supabase
				.from("plans")
				.select("price")
				.eq("id", existingKouden.plan_id)
				.single();
			currentPrice = cp?.price || 0;
		}
		// Retrieve Stripe secret key safely and initialize
		const stripeSecret = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecret) {
			console.error("[ERROR] STRIPE_SECRET_KEY is not set");
			return { error: "支払いセッションの生成に失敗しました" };
		}
		// FIRST_EDIT: 開発環境では環境変数STRIPE_API_VERSIONを使い、それ以外は既存バージョンを使用
		const stripeApiVersion = (
			process.env.NODE_ENV === "development" && process.env.STRIPE_API_VERSION
				? process.env.STRIPE_API_VERSION
				: "2025-05-28.basil"
		) as Stripe.StripeConfig["apiVersion"];
		const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });
		// ユーザー取得（metadata用）
		const supabaseClient = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabaseClient.auth.getUser();
		if (userError || !user) {
			console.error("[ERROR] ユーザー取得失敗:", userError);
			return { error: "認証が必要です" };
		}
		const userId = user.id;
		// 決済金額の算出
		let amount = plan.price;
		if (planCode === "premium_full_support" && typeof expectedCount === "number") {
			amount = calcSupportFee(expectedCount, plan.price);
		}
		if (currentPrice && plan.price > currentPrice) {
			amount = amount - currentPrice;
		}
		// 開発環境ではリダイレクト先をローカルホストに設定
		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8788"
				: process.env.NEXT_PUBLIC_APP_URL;
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card", "konbini"],
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
		console.error("[ERROR] Error creating Stripe session:", error);
		return { error: "支払いセッションの生成に失敗しました" };
	}
}
