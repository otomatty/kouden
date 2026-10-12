import { PAID_PRICE_JPY } from "@kouden/domain";
import { Hono } from "hono";
import {
	type FulfillOutcome,
	fulfillCheckout,
	type RefundOutcome,
	refundPayment,
} from "../billing/purchases.ts";
import { toSession, verifyWebhook } from "../billing/stripe.ts";
import type { Caller } from "../ledger/types.ts";
import { log } from "../lib/logger.ts";
import type { AppEnv } from "../types.ts";
import { basePath, type Ctx, errorResponse } from "./helpers.tsx";
import { notifyLedger } from "./members.tsx";

/**
 * 有料版の購入（E9-2, 04 §7）。オーナーが Stripe Checkout で支払い、Webhook で購入を確定する。
 * 完了画面（success_url）に戻ってきたときも Checkout Session を確認して確定する
 * （Webhook が遅れても、すぐに有料版として使えるようにする。何度確定しても購入は 1 件）。
 */
export function registerBillingRoutes(k: Hono<AppEnv>): void {
	k.post("/billing/checkout", async (c) => {
		const kouden = c.get("kouden");
		const user = c.get("user");
		// 購入はオーナーだけ（03 §5）。アーカイブ中は解除してから
		if (!user || kouden.memberRole !== "owner" || kouden.status !== "active") {
			return errorResponse(c, 403);
		}
		if (kouden.plan === "paid") return c.redirect(settingsUrl(c), 303);
		const stripe = c.get("stripe")();
		if (!stripe) {
			log("error", "stripe_not_configured", { koudenId: kouden.id });
			return c.redirect(settingsUrl(c, "purchase_unavailable"), 303);
		}
		const origin = c.env.APP_ORIGIN;
		let url: string | null;
		try {
			const session = await stripe.createCheckoutSession({
				koudenId: kouden.id,
				koudenTitle: kouden.title,
				userId: user.id,
				email: user.email,
				amount: PAID_PRICE_JPY,
				// {CHECKOUT_SESSION_ID} は Stripe が置き換える
				successUrl: `${origin}${basePath(c)}/billing/done?session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: `${origin}${settingsUrl(c, "purchase_cancelled")}`,
			});
			url = session.url;
		} catch (err) {
			// キーの誤り・Stripe の障害など。何も記録していないので、設定画面に戻して案内する
			log("error", "checkout_create_failed", {
				koudenId: kouden.id,
				error: err instanceof Error ? err.message : String(err),
			});
			url = null;
		}
		if (!url) return c.redirect(settingsUrl(c, "purchase_unavailable"), 303);
		return c.redirect(url, 303);
	});

	k.get("/billing/done", async (c) => {
		const kouden = c.get("kouden");
		const sessionId = c.req.query("session_id") ?? "";
		const stripe = c.get("stripe")();
		if (!/^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId) || !stripe) return c.notFound();
		let outcome: FulfillOutcome;
		try {
			const session = await stripe.retrieveCheckoutSession(sessionId);
			// 別の香典帳の Checkout Session は受け付けない
			if (session.metadata.kouden_id !== kouden.id) return c.notFound();
			outcome = await fulfillCheckout(c.env.DB, session, c.get("now"));
		} catch (err) {
			// 確認できなくても、支払い済みなら Webhook が確定する
			log("warn", "checkout_confirm_failed", {
				koudenId: kouden.id,
				error: err instanceof Error ? err.message : String(err),
			});
			return c.redirect(settingsUrl(c, "purchase_pending"), 303);
		}
		if (outcome.kind === "fulfilled" && outcome.upgraded) {
			await notifyPlan(c.env, c.get("caller"), "paid");
		}
		// 表示は確定後の plan で決める（返金済みの支払いでは、確定しても無料のまま）
		const current = await c.env.DB.prepare("SELECT plan FROM koudens WHERE id = ?")
			.bind(kouden.id)
			.first<{ plan: string }>();
		const notice =
			current?.plan === "paid"
				? "purchased"
				: outcome.kind === "ignored"
					? "purchase_pending"
					: "purchase_refunded";
		return c.redirect(settingsUrl(c, notice), 303);
	});
}

const settingsUrl = (c: Ctx, notice?: string) =>
	`${basePath(c)}/settings${notice ? `?notice=${notice}` : ""}#billing`;

/** plan の変更を DO に知らせる（変更ログに残し、開いている画面の残り件数の表示を取り直す） */
async function notifyPlan(env: Env, actor: Caller, plan: "free" | "paid"): Promise<void> {
	await notifyLedger(env, actor, {
		entity: "plan",
		entityId: actor.koudenId,
		op: "update",
		diff: { plan: [plan === "paid" ? "free" : "paid", plan] },
	});
}

/** Webhook には呼び出し元のユーザーがいないので、購入者（または運営）として記録する */
async function webhookActor(env: Env, koudenId: string, userId: string | null): Promise<Caller> {
	const user = userId
		? await env.DB.prepare("SELECT display_name FROM users WHERE id = ?")
				.bind(userId)
				.first<{ display_name: string }>()
		: null;
	return {
		koudenId,
		userId: userId ?? "system",
		displayName: user?.display_name ?? "システム",
		role: "owner",
		plan: "paid",
	};
}

// ---- Webhook（/webhooks/stripe） -------------------------------------------------

export const webhookRoutes = new Hono<AppEnv>();

webhookRoutes.post("/webhooks/stripe", async (c) => {
	const secret = c.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		log("error", "stripe_webhook_not_configured", {});
		return c.text("not configured", 500);
	}
	const payload = await c.req.text();
	const event = await verifyWebhook(
		payload,
		c.req.header("stripe-signature"),
		secret,
		c.get("now"),
	);
	if (!event) {
		log("warn", "stripe_webhook_invalid_signature", {});
		return c.text("invalid signature", 400);
	}
	const ref = { id: event.id, type: event.type };
	const now = c.get("now");

	switch (event.type) {
		case "checkout.session.completed":
		case "checkout.session.async_payment_succeeded": {
			const session = toSession(event.data.object);
			// コンビニ払いなどは、completed の時点では未払い。支払われたら async_payment_succeeded が届く
			if (session.paymentStatus !== "paid") break;
			const outcome = await fulfillCheckout(c.env.DB, session, now, ref);
			log("info", "stripe_checkout", { eventId: event.id, outcome: outcome.kind });
			// 実際に無料から有料に変わった場合だけ知らせる（二重決済・削除済みの香典帳では知らせない）
			if (outcome.kind === "fulfilled" && outcome.upgraded) {
				const actor = await webhookActor(c.env, outcome.koudenId, outcome.userId);
				await notifyPlan(c.env, actor, "paid");
			}
			break;
		}
		case "charge.refunded": {
			const charge = event.data.object;
			const outcome: RefundOutcome = await refundPayment(
				c.env.DB,
				{
					paymentIntentId: typeof charge.payment_intent === "string" ? charge.payment_intent : null,
					fullyRefunded: charge.refunded === true,
				},
				now,
				ref,
			);
			log("info", "stripe_refund", { eventId: event.id, outcome: outcome.kind });
			if (outcome.kind === "refunded" && outcome.downgraded) {
				const actor = await webhookActor(c.env, outcome.koudenId, null);
				await notifyPlan(c.env, { ...actor, plan: "free" }, "free");
			}
			break;
		}
		case "checkout.session.async_payment_failed":
			log("info", "stripe_async_payment_failed", { eventId: event.id });
			break;
		default:
			// 購読していないイベントは受け取るだけ
			break;
	}
	return c.json({ received: true });
});
