import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildReminderEmail } from "@/utils/emailTemplates/reminder";
import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Web Crypto API で SHA-256 ハッシュを生成する。
 */
async function sha256(data: string): Promise<Uint8Array> {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
	return new Uint8Array(buf);
}

/**
 * SHA-256 ハッシュ後に定数時間比較することで、入力長の漏洩までを防ぐ。
 *
 * - 直接 `a.length !== b.length` を比較すると、誤った長さで早期 return することで
 *   攻撃者がシークレットの長さを timing から推測できる可能性がある。
 * - ハッシュ後は両方とも 32 バイト固定長になるため、length チェックの分岐は
 *   入力に対して定数時間。XOR ループも全 32 バイトを必ず舐める。
 */
async function timingSafeEqualHashed(a: string, b: string): Promise<boolean> {
	const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
	// 両ハッシュとも 32 バイト固定。length 不一致は理論上発生しない防御線。
	if (ha.length !== hb.length) return false;
	let diff = 0;
	for (let i = 0; i < ha.length; i++) {
		diff |= (ha[i] as number) ^ (hb[i] as number);
	}
	return diff === 0;
}

/**
 * Cron リクエストの認証。`Authorization: Bearer <CRON_SECRET>` を必須にする。
 * Vercel Cron は環境変数 `CRON_SECRET` を自動的に Authorization ヘッダーに載せて
 * 呼び出すので、単一の Bearer チェックでカバーできる。
 *
 * 環境変数は build 時ではなく **リクエスト時** に検証する。Next.js は build フェーズ
 * で route モジュールを評価するため、トップレベルの throw は環境変数未設定時に
 * ビルドを落としてしまう（Vercel Preview 等で問題になる）。フェイルクローズドの
 * 性質はリクエスト時の戻り値 500/401 で維持できる。
 */
async function isAuthorizedCronRequest(request: Request, cronSecret: string): Promise<boolean> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return false;
	}
	const provided = authHeader.slice("Bearer ".length).trim();
	return timingSafeEqualHashed(provided, cronSecret);
}

export async function GET(request: Request) {
	// 環境変数チェック（リクエスト時に評価して build を落とさない）
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret || cronSecret.length < 32) {
		logger.error(
			{ path: "/api/cron/send-reminders" },
			"CRON_SECRET is not set or too short (require >= 32 chars). Generate one with: openssl rand -hex 32",
		);
		return new NextResponse("Server misconfiguration", { status: 500 });
	}

	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		logger.error({ path: "/api/cron/send-reminders" }, "RESEND_API_KEY is not set");
		return new NextResponse("Server misconfiguration", { status: 500 });
	}
	const resend = new Resend(apiKey);

	if (!(await isAuthorizedCronRequest(request, cronSecret))) {
		logger.warn(
			{
				path: "/api/cron/send-reminders",
				hasAuthHeader: !!request.headers.get("authorization"),
			},
			"Unauthorized cron request rejected",
		);
		return new NextResponse("Unauthorized", { status: 401 });
	}

	// Supabase 管理クライアント取得
	const supabase = createAdminClient();

	// 無料プランID取得
	const { data: freePlan, error: planError } = await supabase
		.from("plans")
		.select("id")
		.eq("code", "free")
		.single();
	if (planError || !freePlan) {
		logger.error(
			{
				error: planError?.message,
				code: planError?.code,
			},
			"[send-reminders] planError",
		);
		return NextResponse.error();
	}

	// 通知シナリオ定義
	const scenarios = [
		{ daysLeft: 2, typeKey: "reminder_before", message: "閲覧期限まであと2日です。" },
		{ daysLeft: 1, typeKey: "reminder_before", message: "閲覧期限まであと1日です。" },
		{ daysLeft: 0, typeKey: "reminder_after", message: "閲覧期限当日です。" },
	];

	for (const { daysLeft, typeKey, message } of scenarios) {
		// 対象日を計算 (作成日 + 14 - daysLeft)
		const targetDate = new Date();
		targetDate.setDate(targetDate.getDate() - (14 - daysLeft));
		const dateStr = targetDate.toISOString().slice(0, 10);

		// 対象の香典帳を取得
		const { data: koudenList, error: koudenError } = await supabase
			.from("koudens")
			.select("id, owner_id")
			.eq("plan_id", freePlan.id)
			.eq("created_at::date", dateStr);
		if (koudenError || !koudenList) {
			logger.error(
				{
					error: koudenError?.message,
					code: koudenError?.code,
					daysLeft,
					dateStr,
				},
				"[send-reminders] koudenError",
			);
			continue;
		}

		for (const kouden of koudenList) {
			// オーナーのメール取得 (auth.users テーブルから取得)
			const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
				kouden.owner_id,
			);
			if (userError || !userData.user?.email) continue;
			const userEmail = userData.user.email;

			// メッセージテンプレート組み立て
			const { subject, html } = buildReminderEmail(message);

			// メール送信
			await resend.emails.send({
				from: "no-reply@kouden-app.com",
				to: userEmail,
				subject,
				html,
			});

			// notification_types ID取得
			const { data: ntType, error: ntError } = await supabase
				.from("notification_types")
				.select("id")
				.eq("type_key", typeKey)
				.single();
			if (ntError || !ntType) continue;

			// アプリ内通知挿入
			await supabase.from("notifications").insert({
				user_id: kouden.owner_id,
				notification_type_id: ntType.id,
				data: { message },
				link_path: null,
			});
		}
	}

	return NextResponse.json({ ok: true });
}
