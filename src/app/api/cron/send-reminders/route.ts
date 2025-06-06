import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { buildReminderEmail } from "@/utils/emailTemplates/reminder";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
	throw new Error("Missing RESEND_API_KEY");
}
const resend = new Resend(apiKey);

export async function GET() {
	// Supabase 管理クライアント取得
	const supabase = createAdminClient();

	// 無料プランID取得
	const { data: freePlan, error: planError } = await supabase
		.from("plans")
		.select("id")
		.eq("code", "free")
		.single();
	if (planError || !freePlan) {
		console.error("[send-reminders] planError:", planError);
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
			console.error("[send-reminders] koudenError:", koudenError);
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
