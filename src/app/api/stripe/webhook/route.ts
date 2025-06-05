import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

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
		const metadata = session.metadata as Record<string, string>;
		const koudenId = metadata.koudenId;
		if (!koudenId) {
			console.error("Missing metadata.koudenId");
			return new NextResponse("Invalid webhook metadata", { status: 400 });
		}
		const planCode = metadata.planCode;
		if (!planCode) {
			console.error("Missing metadata.planCode");
			return new NextResponse("Invalid webhook metadata", { status: 400 });
		}
		const userId = metadata.userId;
		if (!userId) {
			console.error("Missing metadata.userId");
			return new NextResponse("Invalid webhook metadata", { status: 400 });
		}

		// Supabase admin client
		const supabase = createAdminClient();

		// Create kouden record if not exists
		const { data: existingKouden } = await supabase
			.from("koudens")
			.select("id")
			.eq("id", koudenId)
			.single();
		if (!existingKouden) {
			const planRes = await supabase.from("plans").select("id").eq("code", planCode).single();
			if (planRes.error || !planRes.data) {
				console.error("Plan not found for code:", planCode);
				return new NextResponse("Plan not found", { status: 400 });
			}
			const planId = planRes.data.id;
			const { error: koudenError } = await supabase.from("koudens").insert({
				id: koudenId,
				title: metadata.title || "",
				description: metadata.description || "",
				owner_id: userId,
				created_by: userId,
				plan_id: planId,
			});
			if (koudenError) console.error("Error creating kouden:", koudenError);
		}

		// Upsert purchase history
		const planRes2 = await supabase.from("plans").select("id").eq("code", planCode).single();
		if (planRes2.error || !planRes2.data) {
			console.error("Plan not found for code:", planCode);
			return new NextResponse("Plan not found", { status: 400 });
		}
		const planId2 = planRes2.data.id;
		const amountTotal = session.amount_total;
		if (amountTotal == null) {
			console.error("Session amount_total is missing");
			return new NextResponse("Invalid session data", { status: 400 });
		}
		const { error: purchaseError } = await supabase.from("kouden_purchases").insert({
			kouden_id: koudenId,
			user_id: userId,
			plan_id: planId2,
			expected_count: metadata.expectedCount ? Number(metadata.expectedCount) : null,
			amount_paid: amountTotal,
			stripe_session_id: session.id,
		});
		if (purchaseError) console.error("Error inserting purchase:", purchaseError);

		// Update kouden plan_id for upgrades
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ plan_id: planId2, status: "active" })
			.eq("id", koudenId);
		if (updateError) console.error("Error updating kouden plan_id and status:", updateError);
	}

	return NextResponse.json({ received: true });
}
