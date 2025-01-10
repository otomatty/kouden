import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const oauth2Client = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI,
);

// アクセストークンを設定
oauth2Client.setCredentials({
	refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export async function sendEmail({
	to,
	subject,
	text,
	html,
}: {
	to: string;
	subject: string;
	text: string;
	html: string;
}) {
	try {
		const gmail = google.gmail({ version: "v1", auth: oauth2Client });

		// メールの内容をBase64エンコード
		const message = [
			`To: ${to}`,
			`Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
			"MIME-Version: 1.0",
			'Content-Type: multipart/alternative; boundary="boundary"',
			"",
			"--boundary",
			"Content-Type: text/plain; charset=UTF-8",
			"Content-Transfer-Encoding: 7bit",
			"",
			text,
			"",
			"--boundary",
			"Content-Type: text/html; charset=UTF-8",
			"Content-Transfer-Encoding: 7bit",
			"",
			html,
			"",
			"--boundary--",
		].join("\n");

		const encodedMessage = Buffer.from(message)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");

		await gmail.users.messages.send({
			userId: "me",
			requestBody: {
				raw: encodedMessage,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error sending email:", error);
		return { success: false, error: "メールの送信に失敗しました" };
	}
}
