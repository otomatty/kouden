"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";

/**
 * 購入後に領収書PDFを生成し、Storageへ保存、メール送信を行う
 * @param purchaseId 購入履歴ID
 */
export async function exportReceiptToPdf(purchaseId: string): Promise<void> {
	const supabase = createAdminClient();

	// 購入情報取得
	const { data: purchase, error: purchaseError } = await supabase
		.from("kouden_purchases")
		.select("id, kouden_id, plan_id, user_id, amount_paid, purchased_at, stripe_session_id")
		.eq("id", purchaseId)
		.single();
	if (purchaseError || !purchase) {
		console.error("[exportReceiptToPdf] purchaseError:", purchaseError);
		throw new Error("購入情報の取得に失敗しました");
	}

	// プラン名取得
	const { data: plan, error: planError } = await supabase
		.from("plans")
		.select("name")
		.eq("id", purchase.plan_id)
		.single();
	if (planError || !plan) {
		console.error("[exportReceiptToPdf] planError:", planError);
		throw new Error("プラン情報の取得に失敗しました");
	}

	// 香典帳タイトル取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("title")
		.eq("id", purchase.kouden_id)
		.single();
	if (koudenError || !kouden) {
		console.error("[exportReceiptToPdf] koudenError:", koudenError);
		throw new Error("香典帳情報の取得に失敗しました");
	}

	// ユーザー情報取得（Service Roleで認証ユーザーテーブルにアクセス）
	const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
		purchase.user_id,
	);
	if (userError || !userData.user) {
		console.error("[exportReceiptToPdf] userError:", userError);
		throw new Error("ユーザー情報の取得に失敗しました");
	}
	const userEmail = userData.user.email;
	if (!userEmail) {
		throw new Error("ユーザーのメールアドレスが見つかりません");
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
	if (storageError) {
		console.error("[exportReceiptToPdf] storageError:", storageError);
		throw new Error("Storageへのアップロードに失敗しました");
	}

	// メール送信
	const resendApiKey = process.env.RESEND_API_KEY;
	if (!resendApiKey) {
		throw new Error("RESEND_API_KEYが設定されていません");
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
	if (typeError || !notifType) {
		console.error("[exportReceiptToPdf] notifTypeError:", typeError);
		throw new Error("通知タイプの取得に失敗しました");
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
	if (notifError) {
		console.error("[exportReceiptToPdf] notifError:", notifError);
		throw new Error("通知作成に失敗しました");
	}
}
