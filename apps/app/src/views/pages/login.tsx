import type { Child, FC } from "hono/jsx";
import { ui } from "@kouden/ui";
import { GoogleButton } from "../components/google-button.tsx";

export const LOGIN_ERRORS = {
	cancelled: "ログインがキャンセルされました。",
	expired: "ログインの有効期限が切れました。もう一度お試しください。",
	failed: "ログインに失敗しました。時間をおいてもう一度お試しください。",
	rate_limited: "短時間に何度もログインが試みられました。しばらく待ってからお試しください。",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERRORS;

const Icon: FC<{ children?: Child }> = ({ children }) => (
	<span class="flex size-10 flex-none items-center justify-center rounded-full border border-line bg-surface">
		<svg
			viewBox="0 0 24 24"
			class="size-5"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			{children}
		</svg>
	</span>
);

const POINTS = [
	{
		title: "受付でスマホから記録",
		body: "登録するとその場で受付番号を表示します。",
		icon: (
			<>
				<rect x="6" y="2.5" width="12" height="19" rx="2.5" />
				<path d="M10.5 18.5h3" />
			</>
		),
	},
	{
		title: "ご家族と同時に使える",
		body: "招待リンクで編集する人・見るだけの人を加えられます。",
		icon: (
			<>
				<circle cx="9" cy="8" r="3.2" />
				<path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
				<circle cx="17" cy="9" r="2.4" />
				<path d="M16.5 14.4c2.4.2 4 1.8 4.5 4.6" />
			</>
		),
	},
	{
		title: "香典返しまでまとめて",
		body: "いただいた額に合わせて品を提案し、宛名を印刷できます。",
		icon: (
			<>
				<rect x="3.5" y="9" width="17" height="11.5" rx="1.5" />
				<path d="M2.5 9h19" />
				<path d="M12 9v11.5" />
				<path d="M12 9c-1.5-3.5-5.5-4.5-6-2s3.5 2 6 2c2.5 0 6.5.5 6-2s-4.5-1.5-6 2z" />
			</>
		),
	},
] as const;

/**
 * ログイン（E1-1）。PC では左にサービスの説明、右にログインを並べ、スマホではログインを先に出す。
 * 招待リンクから初めて来た人にも、何のアプリかが分かるようにする
 */
export const LoginPage: FC<{ startUrl: string; error?: LoginErrorCode }> = ({
	startUrl,
	error,
}) => (
	<div class={`${ui.container} max-w-4xl`}>
		<div class="flex flex-col gap-10 md:flex-row-reverse md:items-center md:gap-16">
			<section aria-labelledby="login" class={`${ui.card} space-y-5 md:w-96 md:flex-none`}>
				<h1 id="login" class={ui.h2}>
					ログイン
				</h1>
				{error ? (
					<p role="alert" class={ui.alert}>
						{LOGIN_ERRORS[error]}
					</p>
				) : null}
				<GoogleButton href={startUrl} class="w-full">
					Google でログイン
				</GoogleButton>
				<p class="text-center text-sm text-muted">はじめての方も、そのまま登録できます。</p>
				<p class="border-t border-line pt-4 text-center text-sm">
					<a
						href="/faq#legacy-account"
						class="text-muted underline underline-offset-4 hover:text-ink"
					>
						以前のアプリをお使いだった方へ
					</a>
				</p>
			</section>
			<section aria-labelledby="login-intro" class="flex-1 space-y-7">
				<div class="space-y-3">
					<p class="text-sm tracking-[0.3em] text-muted">香典帳</p>
					<p
						id="login-intro"
						class="text-2xl leading-normal font-semibold tracking-wide sm:text-3xl"
					>
						<span class="inline-block">葬儀の受付から、</span>
						<span class="inline-block">香典返しまで。</span>
					</p>
					<p class="leading-relaxed text-muted">
						香典・供物・弔電を記録して、ご家族と同じ香典帳を見ながら進められます。
					</p>
				</div>
				<ul class="space-y-5">
					{POINTS.map((p) => (
						<li class="flex items-start gap-4">
							<Icon>{p.icon}</Icon>
							<span>
								<span class="block font-semibold">{p.title}</span>
								<span class="block text-sm leading-relaxed text-muted">{p.body}</span>
							</span>
						</li>
					))}
				</ul>
			</section>
		</div>
	</div>
);
