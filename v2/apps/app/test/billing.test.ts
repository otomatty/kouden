import { env, runInDurableObject } from "cloudflare:test";
import { FREE_GIFT_LIMIT, PAID_PRICE_JPY } from "@kouden/domain";
import { describe, expect, it } from "vitest";
import {
	type CheckoutSession,
	type CreateCheckoutInput,
	hmacSha256,
	StripeApiError,
	type StripeClient,
	stripeClient,
	verifyWebhook,
} from "../src/billing/stripe.ts";
import { ledgerFor } from "../src/ledger/client.ts";
import { formPost, HANAKO, makeApp, TARO } from "./helpers.ts";

const WEBHOOK_SECRET = "whsec_test_secret";

/** Stripe の API の代わり。作成した Checkout Session を覚えておき、pay() で支払い済みにする */
function fakeStripe() {
	const created: CreateCheckoutInput[] = [];
	const sessions = new Map<string, CheckoutSession>();
	const client: StripeClient = {
		async createCheckoutSession(input) {
			created.push(input);
			const id = `cs_test_${crypto.randomUUID().replaceAll("-", "")}`;
			const session: CheckoutSession = {
				id,
				url: `https://checkout.stripe.com/c/pay/${id}`,
				status: "open",
				paymentStatus: "unpaid",
				amountTotal: input.amount,
				currency: "jpy",
				paymentIntentId: null,
				metadata: { kouden_id: input.koudenId, user_id: input.userId },
			};
			sessions.set(id, session);
			return session;
		},
		async retrieveCheckoutSession(id) {
			const session = sessions.get(id);
			if (!session) throw new StripeApiError(404, `No such checkout.session: ${id}`);
			return session;
		},
	};
	const pay = (id: string) => {
		const session = sessions.get(id);
		if (!session) throw new Error(`unknown session ${id}`);
		const paid: CheckoutSession = {
			...session,
			status: "complete",
			paymentStatus: "paid",
			paymentIntentId: `pi_${id.slice(8)}`,
		};
		sessions.set(id, paid);
		return paid;
	};
	return { client, created, sessions, pay };
}

/** Stripe の JSON の形の Checkout Session（Webhook の data.object） */
const sessionJson = (s: CheckoutSession) => ({
	id: s.id,
	object: "checkout.session",
	status: s.status,
	payment_status: s.paymentStatus,
	amount_total: s.amountTotal,
	currency: s.currency,
	payment_intent: s.paymentIntentId,
	metadata: s.metadata,
});

/** 全額返金された Charge（Webhook の data.object） */
const refundedCharge = (s: CheckoutSession) => ({
	id: `ch_${s.id.slice(8)}`,
	object: "charge",
	payment_intent: s.paymentIntentId,
	refunded: true,
	amount_refunded: s.amountTotal,
});

async function signed(payload: string, at = Date.now(), secret = WEBHOOK_SECRET) {
	const t = Math.floor(at / 1000);
	return `t=${t},v1=${await hmacSha256(secret, `${t}.${payload}`)}`;
}

async function setup() {
	const stripe = fakeStripe();
	const taro = makeApp(TARO, undefined, { stripe: () => stripe.client });
	await taro.login();
	const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
	const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
	const reception = await (await taro.request(`/k/${koudenId}/reception`)).text();
	const eventId = /name="eventId" value="([^"]+)"/.exec(reception)?.[1] ?? "";
	const give = (name: string) =>
		taro.request(
			`/k/${koudenId}/reception`,
			formPost({ eventId, kind: "koden", name, amount: "5000" }),
		);
	/** Stripe からの Webhook を模す（Origin なし・JSON・署名付き） */
	const webhook = async (
		event: { id?: string; type: string; object: Record<string, unknown> },
		options: { signature?: string } = {},
	) => {
		const payload = JSON.stringify({
			id: event.id ?? `evt_${crypto.randomUUID().replaceAll("-", "")}`,
			object: "event",
			type: event.type,
			data: { object: event.object },
		});
		return taro.app.request(
			"/webhooks/stripe",
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					"stripe-signature": options.signature ?? (await signed(payload)),
				},
				body: payload,
			},
			env,
		);
	};
	/** 購入ボタン → Checkout Session の作成 → 支払い */
	const checkoutAndPay = async () => {
		const res = await taro.request(`/k/${koudenId}/billing/checkout`, formPost({}));
		expect(res.status).toBe(303);
		const sessionId = res.headers.get("location")?.split("/").pop() ?? "";
		return stripe.pay(sessionId);
	};
	return { stripe, taro, koudenId, give, webhook, checkoutAndPay };
}

const plan = async (koudenId: string) =>
	(
		await env.DB.prepare("SELECT plan FROM koudens WHERE id = ?")
			.bind(koudenId)
			.first<{ plan: string }>()
	)?.plan;

const purchases = async (koudenId: string) =>
	(
		await env.DB.prepare(
			"SELECT amount, status, source, stripe_payment_intent_id FROM purchases WHERE kouden_id = ?",
		)
			.bind(koudenId)
			.all()
	).results;

async function addMember(koudenId: string, email: string, role: "editor" | "viewer") {
	const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
		.bind(email)
		.first<{ id: string }>();
	await env.DB.prepare(
		"INSERT INTO kouden_members (kouden_id, user_id, role, joined_at) VALUES (?, ?, ?, '')",
	)
		.bind(koudenId, user?.id, role)
		.run();
}

describe("Webhook の署名検証（04 §7）", () => {
	const payload = JSON.stringify({ id: "evt_1", type: "ping", data: { object: {} } });
	const now = new Date("2026-10-12T00:00:00Z");

	it("正しい署名・時刻のずれが 5 分以内なら受け付ける。シークレットのローテーション中の複数の v1 にも対応する", async () => {
		const t = Math.floor(now.getTime() / 1000) - 299;
		const good = await hmacSha256(WEBHOOK_SECRET, `${t}.${payload}`);
		const other = await hmacSha256("whsec_old", `${t}.${payload}`);
		expect(await verifyWebhook(payload, `t=${t},v1=${good}`, WEBHOOK_SECRET, now)).toMatchObject({
			id: "evt_1",
		});
		expect(
			await verifyWebhook(payload, `t=${t},v1=${other},v1=${good}`, WEBHOOK_SECRET, now),
		).not.toBeNull();
	});

	it("署名違い・古い署名・改ざん・形式違いは拒否する", async () => {
		const t = Math.floor(now.getTime() / 1000);
		const good = await hmacSha256(WEBHOOK_SECRET, `${t}.${payload}`);
		const reject = async (p: string, header: string | null) =>
			expect(await verifyWebhook(p, header, WEBHOOK_SECRET, now)).toBeNull();
		await reject(payload, null);
		await reject(payload, `t=${t}`);
		await reject(payload, `t=${t},v1=${"0".repeat(64)}`);
		await reject(payload.replace("evt_1", "evt_2"), `t=${t},v1=${good}`);
		const old = t - 301;
		await reject(payload, `t=${old},v1=${await hmacSha256(WEBHOOK_SECRET, `${old}.${payload}`)}`);
		await reject(payload, `t=${t},v0=${good}`);
		const notJson = "not json";
		await reject(notJson, `t=${t},v1=${await hmacSha256(WEBHOOK_SECRET, `${t}.${notJson}`)}`);
	});
});

describe("有料版の購入（E9-2）", () => {
	it("上限に達するとオーナーには購入の案内を出し、Webhook で購入が確定すると上限がなくなる", async () => {
		const { stripe, taro, koudenId, give, webhook, checkoutAndPay } = await setup();
		for (let i = 1; i <= FREE_GIFT_LIMIT; i++) expect((await give(`差出人 ${i}`)).status).toBe(303);
		const over = await give("上限を超える人");
		expect(over.status).toBe(422);
		const message = await over.text();
		expect(message).toContain(`無料版で登録できる ${FREE_GIFT_LIMIT} 件に達しました`);
		expect(message).toContain(`/k/${koudenId}/settings#billing`);

		const session = await checkoutAndPay();
		const [input] = stripe.created;
		expect(input).toMatchObject({
			koudenId,
			email: TARO.email,
			amount: PAID_PRICE_JPY,
			cancelUrl: `http://localhost:5173/k/${koudenId}/settings?notice=purchase_cancelled#billing`,
		});
		expect(input?.successUrl).toBe(
			`http://localhost:5173/k/${koudenId}/billing/done?session_id={CHECKOUT_SESSION_ID}`,
		);
		expect(await plan(koudenId)).toBe("free");

		const res = await webhook({ type: "checkout.session.completed", object: sessionJson(session) });
		expect(res.status).toBe(200);
		expect(await plan(koudenId)).toBe("paid");
		expect(await purchases(koudenId)).toEqual([
			{
				amount: PAID_PRICE_JPY,
				status: "paid",
				source: "stripe",
				stripe_payment_intent_id: session.paymentIntentId,
			},
		]);
		expect((await give("上限を超える人")).status).toBe(303);

		const settings = await (await taro.request(`/k/${koudenId}/settings`)).text();
		expect(settings).toContain("有料版です。");
		expect(settings).toContain("山田 太郎さんが購入しました");
		expect(settings).not.toContain("有料版を購入する");

		// 開いている画面の残り件数を取り直せるよう、変更を記録して知らせる
		const logged = await runInDurableObject(ledgerFor(env, koudenId), (_obj, state) =>
			state.storage.sql
				.exec<{ entity: string; diff: string }>(
					"SELECT entity, diff FROM change_log WHERE entity = 'plan'",
				)
				.toArray(),
		);
		expect(logged).toEqual([{ entity: "plan", diff: '{"plan":["free","paid"]}' }]);
	});

	it("同じイベントの再送・完了画面と Webhook の両方からの確定でも、購入は 1 件だけ", async () => {
		const { taro, koudenId, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();

		// 完了画面に戻ってきた時点で確定する（Webhook より先）
		const done = await taro.request(`/k/${koudenId}/billing/done?session_id=${session.id}`);
		expect(done.status).toBe(303);
		expect(done.headers.get("location")).toBe(`/k/${koudenId}/settings?notice=purchased#billing`);
		expect(await plan(koudenId)).toBe("paid");

		const event = {
			id: "evt_same",
			type: "checkout.session.completed",
			object: sessionJson(session),
		};
		expect((await webhook(event)).status).toBe(200);
		expect((await webhook(event)).status).toBe(200);
		expect(await purchases(koudenId)).toHaveLength(1);
		const events = await env.DB.prepare(
			"SELECT count(*) AS n FROM stripe_events WHERE event_id = ?",
		)
			.bind("evt_same")
			.first<{ n: number }>();
		expect(events?.n).toBe(1);
	});

	it("コンビニ払いなどは支払いが済むまで有料にしない", async () => {
		const { stripe, taro, koudenId, webhook } = await setup();
		const res = await taro.request(`/k/${koudenId}/billing/checkout`, formPost({}));
		const id = res.headers.get("location")?.split("/").pop() ?? "";
		const unpaid = { ...(stripe.sessions.get(id) as CheckoutSession), status: "complete" as const };
		stripe.sessions.set(id, unpaid);

		expect(
			(await webhook({ type: "checkout.session.completed", object: sessionJson(unpaid) })).status,
		).toBe(200);
		const done = await taro.request(`/k/${koudenId}/billing/done?session_id=${id}`);
		expect(done.headers.get("location")).toBe(
			`/k/${koudenId}/settings?notice=purchase_pending#billing`,
		);
		expect(await plan(koudenId)).toBe("free");
		expect(await purchases(koudenId)).toEqual([]);

		const paid = stripe.pay(id);
		await webhook({ type: "checkout.session.async_payment_succeeded", object: sessionJson(paid) });
		expect(await plan(koudenId)).toBe("paid");
	});

	it("全額返金で無料に戻し（記録は残す）、一部返金では何もしない", async () => {
		const { taro, koudenId, give, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		await webhook({ type: "checkout.session.completed", object: sessionJson(session) });
		await give("佐藤 一郎");

		const charge = (refunded: boolean) => ({
			id: "ch_1",
			object: "charge",
			payment_intent: session.paymentIntentId,
			refunded,
			amount_refunded: refunded ? PAID_PRICE_JPY : 1000,
		});
		expect((await webhook({ type: "charge.refunded", object: charge(false) })).status).toBe(200);
		expect(await plan(koudenId)).toBe("paid");

		expect((await webhook({ type: "charge.refunded", object: charge(true) })).status).toBe(200);
		expect(await plan(koudenId)).toBe("free");
		expect(await purchases(koudenId)).toMatchObject([{ status: "refunded" }]);
		// 登録済みの記録は消えない（新規登録だけが止まる）
		expect(await (await taro.request(`/k/${koudenId}`)).text()).toContain("佐藤 一郎");
		const settings = await (await taro.request(`/k/${koudenId}/settings`)).text();
		expect(settings).toContain("有料版を購入する");
	});

	it("全額返金の後に完了画面を開き直しても、有料に戻らない", async () => {
		const { taro, koudenId, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		await taro.request(`/k/${koudenId}/billing/done?session_id=${session.id}`);
		expect(await plan(koudenId)).toBe("paid");
		await webhook({ type: "charge.refunded", object: refundedCharge(session) });
		expect(await plan(koudenId)).toBe("free");

		const revisit = await taro.request(`/k/${koudenId}/billing/done?session_id=${session.id}`);
		expect(revisit.headers.get("location")).toBe(
			`/k/${koudenId}/settings?notice=purchase_refunded#billing`,
		);
		await webhook({ type: "checkout.session.completed", object: sessionJson(session) });
		expect(await plan(koudenId)).toBe("free");
		expect(await purchases(koudenId)).toMatchObject([{ status: "refunded" }]);
	});

	it("返金のイベントが購入の確定より先に届いても、返金済みの支払いを有効な購入にしない", async () => {
		const { koudenId, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		await webhook({ type: "charge.refunded", object: refundedCharge(session) });
		await webhook({ type: "checkout.session.completed", object: sessionJson(session) });
		expect(await plan(koudenId)).toBe("free");
		expect(await purchases(koudenId)).toMatchObject([{ status: "refunded" }]);
		// 返金日は先に届いた返金のものを記録する
		const row = await env.DB.prepare("SELECT refunded_at FROM purchases WHERE kouden_id = ?")
			.bind(koudenId)
			.first<{ refunded_at: string | null }>();
		expect(row?.refunded_at).toEqual(expect.any(String));
	});

	it("二重決済では購入を記録するが、プランの変更は 1 回だけ知らせる", async () => {
		const { koudenId, webhook, checkoutAndPay } = await setup();
		const first = await checkoutAndPay();
		const second = await checkoutAndPay();
		await webhook({ type: "checkout.session.completed", object: sessionJson(first) });
		await webhook({ type: "checkout.session.completed", object: sessionJson(second) });
		expect(await plan(koudenId)).toBe("paid");
		expect(await purchases(koudenId)).toHaveLength(2);
		const logged = await runInDurableObject(ledgerFor(env, koudenId), (_obj, state) =>
			state.storage.sql
				.exec<{ n: number }>("SELECT count(*) AS n FROM change_log WHERE entity = 'plan'")
				.toArray(),
		);
		expect(logged).toEqual([{ n: 1 }]);
	});

	it("署名のない・誤った Webhook は 400 で、何も変えない", async () => {
		const { koudenId, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		const object = sessionJson(session);
		const bad = await webhook(
			{ type: "checkout.session.completed", object },
			{ signature: `t=${Math.floor(Date.now() / 1000)},v1=${"a".repeat(64)}` },
		);
		expect(bad.status).toBe(400);
		const wrongSecret = await webhook(
			{ type: "checkout.session.completed", object },
			{ signature: await signed("{}", Date.now(), "whsec_other") },
		);
		expect(wrongSecret.status).toBe(400);
		expect(await plan(koudenId)).toBe("free");
	});

	it("完了画面: 別の香典帳の Checkout Session は受け付けない", async () => {
		const { taro, koudenId, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		const other = await taro.request("/k", formPost({ deceasedName: "山田 二郎" }));
		const otherId = other.headers.get("location")?.split("/").pop() ?? "";
		expect((await taro.request(`/k/${otherId}/billing/done?session_id=${session.id}`)).status).toBe(
			404,
		);
		expect((await taro.request(`/k/${koudenId}/billing/done?session_id=bad`)).status).toBe(404);
		expect(await plan(otherId)).toBe("free");
		expect(await plan(koudenId)).toBe("free");
	});

	it("購入できるのは有効な香典帳のオーナーだけ。編集者には依頼の案内を出す", async () => {
		const { stripe, taro, koudenId } = await setup();
		const hanako = makeApp(HANAKO, undefined, { stripe: () => stripe.client });
		await hanako.login();
		await addMember(koudenId, HANAKO.email, "editor");
		const settings = await (await hanako.request(`/k/${koudenId}/settings`)).text();
		expect(settings).toContain("オーナーに依頼してください");
		expect(settings).not.toContain("billing/checkout");
		expect((await hanako.request(`/k/${koudenId}/billing/checkout`, formPost({}))).status).toBe(
			403,
		);

		await taro.request(`/k/${koudenId}/archive`, formPost({ archived: "1" }));
		expect(await (await taro.request(`/k/${koudenId}/settings`)).text()).toContain(
			"アーカイブを解除すると購入できます",
		);
		expect((await taro.request(`/k/${koudenId}/billing/checkout`, formPost({}))).status).toBe(403);
		expect(stripe.created).toEqual([]);
	});

	it("Stripe の設定がなければ購入を受け付けず、案内を出す", async () => {
		const taro = makeApp(TARO, undefined, { stripe: () => null });
		await taro.login();
		const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
		const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
		const res = await taro.request(`/k/${koudenId}/billing/checkout`, formPost({}));
		expect(res.headers.get("location")).toBe(
			`/k/${koudenId}/settings?notice=purchase_unavailable#billing`,
		);
		expect(await (await taro.request(res.headers.get("location") ?? "")).text()).toContain(
			"購入の受付を停止しています",
		);
	});

	it("Checkout Session の作成に失敗したら、設定画面に戻して案内する", async () => {
		const failing: StripeClient = {
			createCheckoutSession: async () => {
				throw new StripeApiError(500, "api_error");
			},
			retrieveCheckoutSession: async () => {
				throw new StripeApiError(500, "api_error");
			},
		};
		const taro = makeApp(TARO, undefined, { stripe: () => failing });
		await taro.login();
		const created = await taro.request("/k", formPost({ deceasedName: "山田 一郎" }));
		const koudenId = created.headers.get("location")?.split("/").pop() ?? "";
		const res = await taro.request(`/k/${koudenId}/billing/checkout`, formPost({}));
		expect(res.status).toBe(303);
		expect(res.headers.get("location")).toBe(
			`/k/${koudenId}/settings?notice=purchase_unavailable#billing`,
		);
	});

	it("有料の香典帳も削除でき、購入の記録は残る", async () => {
		const { taro, koudenId, webhook, checkoutAndPay } = await setup();
		const session = await checkoutAndPay();
		await webhook({ type: "checkout.session.completed", object: sessionJson(session) });
		const res = await taro.request(
			`/k/${koudenId}/delete`,
			formPost({ confirm: "故 山田 一郎 様" }),
		);
		expect(res.status).toBe(303);
		expect(await plan(koudenId)).toBeUndefined();
		expect(await purchases(koudenId)).toHaveLength(1);
	});
});

describe("Stripe の API 呼び出し", () => {
	it("Checkout Session を作成する要求を組み立て、応答を読み取る", async () => {
		const requests: Request[] = [];
		const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push(new Request(input, init));
			return Response.json({
				id: "cs_test_1",
				object: "checkout.session",
				url: "https://checkout.stripe.com/c/pay/cs_test_1",
				status: "open",
				payment_status: "unpaid",
				amount_total: PAID_PRICE_JPY,
				currency: "jpy",
				payment_intent: null,
				metadata: { kouden_id: "k1", user_id: "u1" },
			});
		}) as typeof fetch;
		const session = await stripeClient("sk_test_x", fetchFn).createCheckoutSession({
			koudenId: "k1",
			koudenTitle: "故 山田 一郎 様",
			userId: "u1",
			email: "taro@example.com",
			amount: PAID_PRICE_JPY,
			successUrl: "https://app.example/done?session_id={CHECKOUT_SESSION_ID}",
			cancelUrl: "https://app.example/cancel",
		});
		expect(session).toMatchObject({
			id: "cs_test_1",
			url: "https://checkout.stripe.com/c/pay/cs_test_1",
			paymentStatus: "unpaid",
			metadata: { kouden_id: "k1", user_id: "u1" },
		});
		const [req] = requests;
		expect(req?.url).toBe("https://api.stripe.com/v1/checkout/sessions");
		expect(req?.headers.get("authorization")).toBe("Bearer sk_test_x");
		const body = new URLSearchParams(await req?.text());
		expect(body.get("mode")).toBe("payment");
		expect(body.get("line_items[0][price_data][currency]")).toBe("jpy");
		expect(body.get("line_items[0][price_data][unit_amount]")).toBe(String(PAID_PRICE_JPY));
		expect(body.get("metadata[kouden_id]")).toBe("k1");
		expect(body.get("payment_intent_data[receipt_email]")).toBe("taro@example.com");
		expect(body.get("success_url")).toBe(
			"https://app.example/done?session_id={CHECKOUT_SESSION_ID}",
		);
	});

	it("エラーの応答は StripeApiError にする", async () => {
		const fetchFn = (async () =>
			Response.json({ error: { message: "Invalid API Key" } }, { status: 401 })) as typeof fetch;
		await expect(
			stripeClient("sk_bad", fetchFn).retrieveCheckoutSession("cs_test_1"),
		).rejects.toMatchObject({ name: "StripeApiError", status: 401, message: "Invalid API Key" });
	});
});
