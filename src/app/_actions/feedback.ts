"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

const feedbackSchema = z.object({
	title: z.string().min(1, "件名を入力してください"),
	description: z.string().min(1, "内容を入力してください"),
	userEmail: z.string().email("有効なメールアドレスを入力してください"),
});

type FeedbackInput = z.infer<typeof feedbackSchema>;

/**
 * フィードバックの送信
 * @param input フィードバック情報
 * @returns フィードバック
 */
export async function sendFeedback(input: FeedbackInput) {
	try {
		const validatedData = feedbackSchema.parse(input);

		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				type: "OAuth2",
				user: process.env.GOOGLE_CLIENT_ID,
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
			},
		});

		const mailOptions = {
			from: process.env.GOOGLE_CLIENT_ID,
			to: "sugai.akimasa@gmail.com",
			subject: `[香典帳アプリ フィードバック] ${validatedData.title}`,
			text: `
フィードバック内容：
${validatedData.description}

送信者のメールアドレス：${validatedData.userEmail}
			`,
		};

		await transporter.sendMail(mailOptions);
		return { success: true };
	} catch (error) {
		console.error("フィードバック送信エラー:", error);
		return { success: false, error: "フィードバックの送信に失敗しました" };
	}
}
