/**
 * Stripe との通信（04 §7, ADR-T09）。使うのは Checkout Session の作成・取得と Webhook の署名検証だけなので、
 * SDK は入れずに REST API を fetch で呼ぶ（Worker の容量を抑え、テストで差し替えやすくする）。
 * 署名検証は Stripe の仕様（https://docs.stripe.com/webhooks#verify-manually）どおり、
 * `t.payload` の HMAC-SHA256 を Web Crypto で計算して比べる。
 */

const API = "https://api.stripe.com/v1";

/** 署名の時刻のずれの許容（Stripe の SDK の既定と同じ 5 分） */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export interface CheckoutSession {
	id: string;
	/** Checkout の画面の URL（作成直後のみ） */
	url: string | null;
	status: "open" | "complete" | "expired" | null;
	/** paid になったら購入を確定する（コンビニ払いなどは complete の時点では unpaid） */
	paymentStatus: "paid" | "unpaid" | "no_payment_required" | null;
	amountTotal: number | null;
	currency: string | null;
	paymentIntentId: string | null;
	metadata: Record<string, string>;
}

export interface CreateCheckoutInput {
	koudenId: string;
	koudenTitle: string;
	userId: string;
	email: string;
	amount: number;
	successUrl: string;
	cancelUrl: string;
}

export interface StripeClient {
	createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
	retrieveCheckoutSession(id: string): Promise<CheckoutSession>;
}

export class StripeApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "StripeApiError";
	}
}

export function stripeClient(secretKey: string, fetchFn: typeof fetch = fetch): StripeClient {
	const call = async (method: "GET" | "POST", path: string, body?: URLSearchParams) => {
		const res = await fetchFn(`${API}${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${secretKey}`,
				...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
			},
			body: body?.toString(),
		});
		const json = (await res.json()) as Record<string, unknown>;
		if (!res.ok) {
			const error = json.error as { message?: string; type?: string } | undefined;
			throw new StripeApiError(res.status, error?.message ?? error?.type ?? "stripe_error");
		}
		return json;
	};

	return {
		async createCheckoutSession(input) {
			const p = new URLSearchParams({
				mode: "payment",
				locale: "ja",
				"line_items[0][quantity]": "1",
				"line_items[0][price_data][currency]": "jpy",
				"line_items[0][price_data][unit_amount]": String(input.amount),
				"line_items[0][price_data][product_data][name]": "香典帳 有料版",
				"line_items[0][price_data][product_data][description]":
					`「${input.koudenTitle}」の登録件数の上限がなくなります（買い切り）`.slice(0, 500),
				client_reference_id: input.koudenId,
				customer_email: input.email,
				"metadata[kouden_id]": input.koudenId,
				"metadata[user_id]": input.userId,
				// 領収書メール（E9-3）。Stripe のダッシュボードで「領収書を送る」を有効にしておく
				"payment_intent_data[receipt_email]": input.email,
				"payment_intent_data[metadata][kouden_id]": input.koudenId,
				success_url: input.successUrl,
				cancel_url: input.cancelUrl,
			});
			return toSession(await call("POST", "/checkout/sessions", p));
		},
		async retrieveCheckoutSession(id) {
			return toSession(await call("GET", `/checkout/sessions/${encodeURIComponent(id)}`));
		},
	};
}

const str = (v: unknown) => (typeof v === "string" ? v : null);

export function toSession(o: Record<string, unknown>): CheckoutSession {
	const paymentIntent = o.payment_intent;
	return {
		id: str(o.id) ?? "",
		url: str(o.url),
		status: str(o.status) as CheckoutSession["status"],
		paymentStatus: str(o.payment_status) as CheckoutSession["paymentStatus"],
		amountTotal: typeof o.amount_total === "number" ? o.amount_total : null,
		currency: str(o.currency),
		// 展開（expand）した場合はオブジェクトになる
		paymentIntentId:
			str(paymentIntent) ??
			(paymentIntent && typeof paymentIntent === "object"
				? str((paymentIntent as { id?: unknown }).id)
				: null),
		metadata: isStringRecord(o.metadata) ? o.metadata : {},
	};
}

function isStringRecord(v: unknown): v is Record<string, string> {
	return (
		typeof v === "object" && v !== null && Object.values(v).every((x) => typeof x === "string")
	);
}

// ---- Webhook ------------------------------------------------------------------

export interface StripeEvent {
	id: string;
	type: string;
	data: { object: Record<string, unknown> };
}

/**
 * Stripe-Signature ヘッダーを検証し、イベントを返す。署名が合わない・古すぎる場合は null。
 * ヘッダーの形式: `t=1700000000,v1=<hex>,v1=<hex>,v0=...`（シークレットのローテーション中は v1 が複数ある）
 */
export async function verifyWebhook(
	payload: string,
	header: string | null | undefined,
	secret: string,
	now: Date,
): Promise<StripeEvent | null> {
	if (!header || !secret) return null;
	let timestamp: number | null = null;
	const signatures: string[] = [];
	for (const part of header.split(",")) {
		const eq = part.indexOf("=");
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (key === "t" && /^\d+$/.test(value)) timestamp = Number(value);
		else if (key === "v1" && /^[0-9a-f]{64}$/.test(value)) signatures.push(value);
	}
	if (timestamp === null || signatures.length === 0) return null;
	if (Math.abs(now.getTime() / 1000 - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return null;

	const expected = await hmacSha256(secret, `${timestamp}.${payload}`);
	const encoder = new TextEncoder();
	const ok = signatures.some((sig) => {
		const a = encoder.encode(sig);
		const b = encoder.encode(expected);
		return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
	});
	if (!ok) return null;

	try {
		const event = JSON.parse(payload) as StripeEvent;
		if (typeof event.id !== "string" || typeof event.type !== "string") return null;
		if (!event.data || typeof event.data.object !== "object" || event.data.object === null) {
			return null;
		}
		return event;
	} catch {
		return null;
	}
}

export async function hmacSha256(secret: string, message: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
	return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
