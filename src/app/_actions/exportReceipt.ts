"use server";

import fs from "node:fs";
import path from "node:path";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

/**
 * 購入後に領収書PDFを生成し、Storageへ保存、メール送信を行う
 * @param purchaseId 購入履歴ID
 */
export async function exportReceiptToPdf(purchaseId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// 購入情報取得
		const { data: purchase, error: purchaseError } = await supabase
			.from("kouden_purchases")
			.select("id, kouden_id, plan_id, user_id, amount_paid, purchased_at, stripe_session_id")
			.eq("id", purchaseId)
			.single();
		if (purchaseError) throw purchaseError;
		if (!purchase) {
			throw new KoudenError("購入情報の取得に失敗しました", ErrorCodes.NOT_FOUND);
		}

		// プラン名取得
		const { data: plan, error: planError } = await supabase
			.from("plans")
			.select("name")
			.eq("id", purchase.plan_id)
			.single();
		if (planError) throw planError;
		if (!plan) {
			throw new KoudenError("プラン情報の取得に失敗しました", ErrorCodes.NOT_FOUND);
		}

		// 香典帳タイトル取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("title")
			.eq("id", purchase.kouden_id)
			.single();
		if (koudenError) throw koudenError;
		if (!kouden) {
			throw new KoudenError("香典帳情報の取得に失敗しました", ErrorCodes.NOT_FOUND);
		}

		// ユーザー情報取得（Service Roleで認証ユーザーテーブルにアクセス）
		const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
			purchase.user_id,
		);
		if (userError) throw userError;
		if (!userData.user) {
			throw new KoudenError("ユーザー情報の取得に失敗しました", ErrorCodes.NOT_FOUND);
		}
		const userEmail = userData.user.email;
		if (!userEmail) {
			throw new KoudenError(
				"ユーザーのメールアドレスが見つかりません",
				ErrorCodes.VALIDATION_ERROR,
			);
		}

		// PDF生成
		const doc = new PDFDocument({ size: "A4", margin: 50 });
		// Embed custom Noto Sans JP font as Buffer to avoid internal fs.readFileSync on path
		const fontPath = path.resolve(process.cwd(), "public/fonts/NotoSansJP-VariableFont_wght.ttf");
		const fontBuffer = fs.readFileSync(fontPath);
		// Guard font methods if available (tests may mock PDFDocument without these methods)
		if (typeof doc.registerFont === "function") {
			doc.registerFont("NotoSansJP", fontBuffer);
		}
		if (typeof doc.font === "function") {
			doc.font("NotoSansJP");
		}
		// ヘッダー
		doc.fontSize(20).text("領収書", { align: "center" });
		doc.moveDown();

		// 購入者情報
		doc.fontSize(12).text(`購入者: ${userEmail}`);
		doc.text(`購入日: ${new Date(purchase.purchased_at).toLocaleDateString()}`);
		doc.text(`香典帳: ${kouden.title}`);
		doc.text(`プラン: ${plan.name}`);
		doc.text(`金額: ¥${purchase.amount_paid.toLocaleString()}`);
		doc.moveDown();

		// フッター
		doc.text("この領収書はシステムにより自動発行されています。", { align: "center" });

		// Stream to buffer using manual chunk collection
		const chunks: Uint8Array[] = [];
		doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
		const streamEnd = new Promise<void>((resolve) => doc.on("end", resolve));
		doc.end();
		await streamEnd;
		// Combine chunks into a single buffer, fallback to empty buffer if none
		const buffer = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);

		// Supabase Storageへアップロード
		const { error: storageError } = await supabase.storage
			.from("receipts")
			.upload(`receipts/${purchase.id}.pdf`, buffer, {
				contentType: "application/pdf",
				upsert: false,
			});
		if (storageError) throw storageError;

		// メール送信
		const resendApiKey = process.env.RESEND_API_KEY;
		if (!resendApiKey) {
			throw new KoudenError("RESEND_API_KEYが設定されていません", ErrorCodes.UNKNOWN_ERROR);
		}
		const resend = new Resend(resendApiKey);
		await resend.emails.send({
			from: "no-reply@kouden-app.com",
			to: userEmail,
			subject: "【香典帳】領収書のお届け",
			html: "この度はご購入いただきありがとうございました。",
			attachments: [
				{
					content: buffer.toString("base64"),
					filename: `receipt_${purchase.id}.pdf`,
					contentType: "application/pdf",
				},
			],
		});

		// 通知テーブル挿入
		// notification_typesテーブルから'receipt_sent'のIDを取得
		const { data: notifType, error: typeError } = await supabase
			.from("notification_types")
			.select("id")
			.eq("type_key", "receipt_sent")
			.single();
		if (typeError) throw typeError;
		if (!notifType) {
			throw new KoudenError("通知タイプの取得に失敗しました", ErrorCodes.NOT_FOUND);
		}
		const { error: notifError } = await supabase.from("notifications").insert({
			user_id: purchase.user_id,
			notification_type_id: notifType.id,
			data: {
				purchaseId,
				message: `${kouden.title}についての領収書を発行しました。${userEmail}を確認してください。`,
			},
			link_path: null,
		});
		if (notifError) throw notifError;

		return null;
	}, "領収書の発行");
}
