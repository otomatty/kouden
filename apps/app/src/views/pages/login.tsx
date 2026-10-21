import type { FC } from "hono/jsx";
import { ui } from "@kouden/ui";

export const LOGIN_ERRORS = {
	cancelled: "ログインがキャンセルされました。",
	expired: "ログインの有効期限が切れました。もう一度お試しください。",
	failed: "ログインに失敗しました。時間をおいてもう一度お試しください。",
	rate_limited: "短時間に何度もログインが試みられました。しばらく待ってからお試しください。",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERRORS;

export const LoginPage: FC<{ startUrl: string; error?: LoginErrorCode }> = ({
	startUrl,
	error,
}) => (
	<div class={`${ui.container} max-w-md`}>
		<div class={`${ui.card} space-y-6 text-center`}>
			<h1 class={ui.h1}>ログイン</h1>
			{error ? (
				<p role="alert" class={ui.alert}>
					{LOGIN_ERRORS[error]}
				</p>
			) : null}
			<a href={startUrl} class={`${ui.buttonPrimary} w-full`}>
				Google アカウントでログイン
			</a>
			<p class="text-left text-sm leading-relaxed text-muted">
				以前メールアドレスでログインしていた方は、同じアドレスの Google アカウント（Gmail または
				Google
				Workspace）でログインすると、以前のデータに自動でつながります。それ以外のアドレスだった方は、お問い合わせください。
			</p>
		</div>
	</div>
);
