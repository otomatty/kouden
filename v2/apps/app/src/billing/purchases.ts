import { uuidv7 } from "@kouden/domain";
import { log } from "../lib/logger.ts";
import type { CheckoutSession } from "./stripe.ts";

/**
 * 購入（D1 purchases）と香典帳の plan（04 §7, 03 §2）。
 * 不変条件「plan = 'paid' ⇔ status = 'paid' の購入が 1 件以上ある」を、購入・返金と同じ batch で保つ。
 * Webhook のイベントの記録（stripe_events）も同じ batch に入れ、同じイベントを二度処理しない。
 */

export interface PurchaseView {
	id: string;
	amount: number;
	source: "stripe" | "legacy" | "admin";
	status: "paid" | "refunded";
	createdAt: string;
	buyerName: string | null;
}

/** 有効な購入（最も新しいもの）。なければ null */
export async function paidPurchase(db: D1Database, koudenId: string): Promise<PurchaseView | null> {
	const row = await db
		.prepare(
			`SELECT p.id, p.amount, p.source, p.status, p.created_at, u.display_name
         FROM purchases p LEFT JOIN users u ON u.id = p.user_id
        WHERE p.kouden_id = ? AND p.status = 'paid'
        ORDER BY p.created_at DESC LIMIT 1`,
		)
		.bind(koudenId)
		.first<{
			id: string;
			amount: number;
			source: PurchaseView["source"];
			status: PurchaseView["status"];
			created_at: string;
			display_name: string | null;
		}>();
	return row
		? {
				id: row.id,
				amount: row.amount,
				source: row.source,
				status: row.status,
				createdAt: row.created_at,
				buyerName: row.display_name,
			}
		: null;
}

export interface WebhookEventRef {
	id: string;
	type: string;
}

export type FulfillOutcome =
	/** 購入を記録した。upgraded はこの購入で香典帳が無料から有料に変わったか */
	| { kind: "fulfilled"; koudenId: string; userId: string; upgraded: boolean }
	/** 同じ Checkout Session の購入は記録済み（Webhook と完了画面の両方から呼ばれるため） */
	| { kind: "already"; koudenId: string }
	/** 同じ Webhook イベントは処理済み */
	| { kind: "duplicate_event" }
	/** 購入として扱えない（支払いが済んでいない・メタデータがない） */
	| { kind: "ignored"; reason: string };

/**
 * 支払いが済んだ Checkout Session から購入を確定する。Webhook と完了画面（success_url）の両方から呼ぶ。
 * 何度呼ばれても購入は 1 件だけ記録される（stripe_checkout_session_id が UNIQUE）。
 * Stripe のイベントは順番どおりに届くとは限らないので、先に全額返金が届いていた支払いは返金済みとして記録する。
 * 香典帳は、有効な購入があるときだけ有料にする（返金後に完了画面を開き直しても有料に戻らない）
 */
export async function fulfillCheckout(
	db: D1Database,
	session: CheckoutSession,
	now: Date,
	event?: WebhookEventRef,
): Promise<FulfillOutcome> {
	const koudenId = session.metadata.kouden_id;
	const userId = session.metadata.user_id;
	if (session.paymentStatus !== "paid") return { kind: "ignored", reason: "not_paid" };
	if (!koudenId || !userId || session.amountTotal === null) {
		log("error", "purchase_invalid_session", { sessionId: session.id });
		return { kind: "ignored", reason: "invalid_session" };
	}

	const at = now.toISOString();
	const statements = [
		...(event ? [recordEvent(db, event, at)] : []),
		db
			.prepare(
				`INSERT INTO purchases (id, kouden_id, user_id, amount, currency, stripe_checkout_session_id,
                                stripe_payment_intent_id, source, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'stripe',
                 CASE WHEN EXISTS (SELECT 1 FROM stripe_refunds WHERE payment_intent_id = ?7)
                      THEN 'refunded' ELSE 'paid' END,
                 ?8)
         ON CONFLICT DO NOTHING`,
			)
			.bind(
				uuidv7(now.getTime()),
				koudenId,
				userId,
				session.amountTotal,
				session.currency ?? "jpy",
				session.id,
				session.paymentIntentId,
				at,
			),
		db
			.prepare(
				`UPDATE koudens SET plan = 'paid', updated_at = ?1
          WHERE id = ?2 AND plan = 'free'
            AND EXISTS (SELECT 1 FROM purchases p WHERE p.kouden_id = ?2 AND p.status = 'paid')`,
			)
			.bind(at, koudenId),
	];

	let results: D1Result[];
	try {
		results = await db.batch(statements);
	} catch (err) {
		if (isDuplicateEvent(err)) return { kind: "duplicate_event" };
		throw err;
	}
	const inserted = (results[event ? 1 : 0]?.meta.changes ?? 0) > 0;
	const upgraded = (results[event ? 2 : 1]?.meta.changes ?? 0) > 0;
	if (!inserted) return { kind: "already", koudenId };

	if (!upgraded) {
		// 有料の香典帳を重ねて購入した（二重決済）・購入の前に香典帳が削除された・確定の前に返金された。
		// 前の 2 つは返金の対応が要る
		const row = await db
			.prepare(
				`SELECT (SELECT status FROM purchases WHERE stripe_checkout_session_id = ?) AS status,
                (SELECT 1 FROM koudens WHERE id = ?) AS kouden`,
			)
			.bind(session.id, koudenId)
			.first<{ status: string | null; kouden: number | null }>();
		const reason =
			row?.status === "refunded"
				? "purchase_already_refunded"
				: row?.kouden
					? "purchase_duplicate"
					: "purchase_for_missing_kouden";
		log("warn", reason, { koudenId, sessionId: session.id });
	}
	return { kind: "fulfilled", koudenId, userId, upgraded };
}

export type RefundOutcome =
	| { kind: "refunded"; koudenId: string; downgraded: boolean }
	| { kind: "duplicate_event" }
	| { kind: "ignored"; reason: string };

/**
 * 返金（charge.refunded）。全額返金された購入を取り消し、有効な購入が残っていなければ無料に戻す。
 * 無料に戻っても記録は消さず、新規登録だけが止まる（04 §7）。一部返金は記録だけして何もしない
 */
export async function refundPayment(
	db: D1Database,
	charge: { paymentIntentId: string | null; fullyRefunded: boolean },
	now: Date,
	event: WebhookEventRef,
): Promise<RefundOutcome> {
	const at = now.toISOString();
	const pi = charge.paymentIntentId;
	if (!pi || !charge.fullyRefunded) {
		try {
			await recordEvent(db, event, at).run();
		} catch (err) {
			if (isDuplicateEvent(err)) return { kind: "duplicate_event" };
			throw err;
		}
		return { kind: "ignored", reason: pi ? "partial_refund" : "no_payment_intent" };
	}

	const purchase = await db
		.prepare("SELECT kouden_id FROM purchases WHERE stripe_payment_intent_id = ?")
		.bind(pi)
		.first<{ kouden_id: string }>();

	let results: D1Result[];
	try {
		results = await db.batch([
			recordEvent(db, event, at),
			// 購入の確定より先に返金が届いた場合に備えて、返金済みの支払いを覚えておく
			db
				.prepare(
					"INSERT INTO stripe_refunds (payment_intent_id, refunded_at) VALUES (?, ?) ON CONFLICT DO NOTHING",
				)
				.bind(pi, at),
			db
				.prepare(
					`UPDATE purchases SET status = 'refunded', refunded_at = ?
            WHERE stripe_payment_intent_id = ? AND status = 'paid'`,
				)
				.bind(at, pi),
			db
				.prepare(
					`UPDATE koudens SET plan = 'free', updated_at = ?
            WHERE id = (SELECT kouden_id FROM purchases WHERE stripe_payment_intent_id = ?)
              AND plan = 'paid'
              AND NOT EXISTS (SELECT 1 FROM purchases p WHERE p.kouden_id = koudens.id AND p.status = 'paid')`,
				)
				.bind(at, pi),
		]);
	} catch (err) {
		if (isDuplicateEvent(err)) return { kind: "duplicate_event" };
		throw err;
	}
	if (!purchase || (results[2]?.meta.changes ?? 0) === 0) {
		return { kind: "ignored", reason: purchase ? "already_refunded" : "unknown_payment" };
	}
	return {
		kind: "refunded",
		koudenId: purchase.kouden_id,
		downgraded: (results[3]?.meta.changes ?? 0) > 0,
	};
}

function recordEvent(db: D1Database, event: WebhookEventRef, at: string): D1PreparedStatement {
	return db
		.prepare("INSERT INTO stripe_events (event_id, type, processed_at) VALUES (?, ?, ?)")
		.bind(event.id, event.type, at);
}

/** stripe_events の主キーの重複（処理済みのイベント）。batch 全体が取り消されている */
function isDuplicateEvent(err: unknown): boolean {
	const message = err instanceof Error ? `${err.message} ${String(err.cause ?? "")}` : String(err);
	return /UNIQUE constraint failed: stripe_events\.event_id/.test(message);
}
