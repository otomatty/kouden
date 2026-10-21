/**
 * メール送信（04 §9）。送るのは香典返しの期限のお知らせだけ。
 * Cloudflare Email Service で送り、問題があれば別の実装（Resend など）に差し替えられるようにしておく。
 */
export interface Mail {
	to: string;
	subject: string;
	text: string;
}

export interface Mailer {
	send(mail: Mail): Promise<void>;
}

export function cloudflareMailer(env: Env): Mailer {
	return {
		async send(mail) {
			if (!env.MAIL_FROM || !env.EMAIL) throw new Error("Email is not configured");
			await env.EMAIL.send({
				from: { name: "香典帳", email: env.MAIL_FROM },
				to: mail.to,
				subject: mail.subject,
				text: mail.text,
			});
		},
	};
}
