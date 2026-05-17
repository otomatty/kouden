import { exportReceiptToPdf } from "@/app/_actions/exportReceipt";
import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { koudenMetadataSchema } from "./schema";

export const runtime = "nodejs";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
	throw new Error("STRIPE_SECRET_KEY must be defined");
}
// FIRST_EDIT: 開発環境では環境変数STRIPE_API_VERSIONを使い、それ以外は既存バージョンを使用
const stripeApiVersion = (
	process.env.NODE_ENV === "development" && process.env.STRIPE_API_VERSION
		? process.env.STRIPE_API_VERSION
		: "2025-05-28.basil"
) as Stripe.StripeConfig["apiVersion"];
const stripe = new Stripe(stripeSecretKey, { apiVersion: stripeApiVersion });

export async function POST(req: Request) {
	const signature = req.headers.get("stripe-signature");
	if (!signature) {
		return new NextResponse("Missing Stripe webhook signature", { status: 400 });
	}
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		return new NextResponse("Missing Stripe webhook secret", { status: 400 });
	}
	const body = await req.text();
	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const parsed = koudenMetadataSchema.safeParse(session.metadata);
		if (!parsed.success) {
			logger.error(
				{ metadata: session.metadata, issues: parsed.error.issues },
				"Invalid checkout session metadata",
			);
			return new NextResponse("Invalid webhook metadata", { status: 400 });
		}
		const { koudenId, planCode, userId, title, description, expectedCount } = parsed.data;

		const amountTotal = session.amount_total;
		if (amountTotal == null) {
			logger.error({ sessionId: session.id }, "Session amount_total is missing");
			return new NextResponse("Invalid session data", { status: 400 });
		}

		// Supabase admin client (service-role)
		const supabase = createAdminClient();

		// koudens の upsert・kouden_purchases の INSERT・koudens.plan_id/status の更新を
		// 単一のトランザクション (RPC 関数) で実行する。
		// stripe_session_id を冪等性キーとして使い、Webhook の再送に対しても安全。
		const { data: rpcRows, error: rpcError } = await supabase.rpc(
			"process_stripe_checkout_completed",
			{
				p_kouden_id: koudenId,
				p_user_id: userId,
				p_plan_code: planCode,
				p_title: title,
				p_description: description,
				p_expected_count: expectedCount ? Number(expectedCount) : null,
				p_amount_paid: amountTotal,
				p_stripe_session_id: session.id,
			},
		);

		if (rpcError) {
			logger.error(
				{
					error: rpcError.message,
					code: rpcError.code,
					koudenId,
					userId,
					planCode,
					sessionId: session.id,
				},
				"Error processing stripe checkout completion (RPC)",
			);
			// 恒久エラー (例: P0002 = plan_not_found) は Stripe の再送で解消しないため 4xx で
			// 確定的に失敗させ、再送ループとログノイズを防ぐ。一時的なDB障害などは 5xx で再送させる。
			const isPermanentError = rpcError.code === "P0002";
			return new NextResponse(
				isPermanentError ? "Invalid checkout metadata" : "Failed to process checkout",
				{ status: isPermanentError ? 400 : 500 },
			);
		}

		const purchaseRow = rpcRows?.[0];
		if (!purchaseRow) {
			logger.error(
				{ koudenId, userId, sessionId: session.id },
				"process_stripe_checkout_completed returned no rows",
			);
			return new NextResponse("Failed to process checkout", { status: 500 });
		}

		// 領収書PDFは新規購入時のみ生成する (再送イベントでの二重発行を防ぐ)。
		// PDF生成失敗は購入処理のロールバック対象外 (ログのみ)。
		if (purchaseRow.is_new_purchase) {
			try {
				const receiptResult = await exportReceiptToPdf(purchaseRow.purchase_id);
				if (!receiptResult.ok) {
					logger.error(
						{
							error: receiptResult.error.message,
							code: receiptResult.error.code,
							purchaseId: purchaseRow.purchase_id,
						},
						"Receipt export error",
					);
				}
			} catch (err) {
				logger.error(
					{
						error: err instanceof Error ? err.message : String(err),
						purchaseId: purchaseRow.purchase_id,
					},
					"Receipt export error",
				);
			}
		}
	}

	return NextResponse.json({ received: true });
}
