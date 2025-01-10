import { sendEmail } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const { success, error } = await sendEmail({
			to: "akms0929ama@gmail.com", // テスト用のメールアドレス
			subject: "テストメール",
			text: "これはテストメールです。",
			html: `
        <h1>テストメール</h1>
        <p>これはGmail APIを使用して送信されたテストメールです。</p>
        <p>送信日時: ${new Date().toLocaleString("ja-JP", {
					timeZone: "Asia/Tokyo",
				})}</p>
      `,
		});

		if (!success) {
			throw new Error(error);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error sending test email:", error);
		return NextResponse.json(
			{ success: false, error: "メールの送信に失敗しました" },
			{ status: 500 },
		);
	}
}
