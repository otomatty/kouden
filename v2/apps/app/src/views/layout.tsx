import { raw } from "hono/html";
import type { Child, FC } from "hono/jsx";
import type { SessionUser } from "../auth/session-store.ts";
import { ui } from "./ui.ts";

const SITE_NAME = "香典帳";

export const Layout: FC<{
	title?: string;
	description?: string;
	user: SessionUser | null;
	children?: Child;
}> = ({ title, description, user, children }) => (
	<>
		{raw("<!DOCTYPE html>")}
		<html lang="ja">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
				<meta
					name="description"
					content={
						description ??
						"葬儀の受付から香典返しまで。香典・供物・弔電をスマホで記録し、家族とリアルタイムに共有できる香典帳アプリです。"
					}
				/>
				<meta name="theme-color" content="#3b3a6b" />
				<link rel="stylesheet" href={`/assets/app.css?v=${__ASSET_VERSION__}`} />
			</head>
			<body class="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
				<Header user={user} />
				<main class="flex-1 py-8 sm:py-12">{children}</main>
				<Footer />
			</body>
		</html>
	</>
);

const Header: FC<{ user: SessionUser | null }> = ({ user }) => (
	<header class="border-b border-line bg-surface">
		<div class={`${ui.container} flex h-14 items-center justify-between`}>
			<a href="/" class="text-lg font-semibold tracking-widest text-ink">
				{SITE_NAME}
			</a>
			<nav class="flex items-center gap-4 text-sm">
				{user ? (
					<>
						<span class="hidden text-muted sm:inline">{user.displayName} さん</span>
						<form method="post" action="/logout">
							<button type="submit" class={ui.buttonSecondary}>
								ログアウト
							</button>
						</form>
					</>
				) : (
					<>
						<a href="/pricing" class="text-muted hover:text-ink">
							料金
						</a>
						<a href="/faq" class="hidden text-muted hover:text-ink sm:inline">
							よくある質問
						</a>
						<a href="/login" class={ui.buttonSecondary}>
							ログイン
						</a>
					</>
				)}
			</nav>
		</div>
	</header>
);

const Footer: FC = () => (
	<footer class="border-t border-line bg-surface py-8 text-sm text-muted">
		<div
			class={`${ui.container} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
		>
			<nav class="flex flex-wrap gap-x-6 gap-y-2">
				<a href="/terms" class="hover:text-ink">
					利用規約
				</a>
				<a href="/privacy" class="hover:text-ink">
					プライバシーポリシー
				</a>
				<a href="/legal/tokushoho" class="hover:text-ink">
					特定商取引法に基づく表記
				</a>
				<a href="/faq" class="hover:text-ink">
					よくある質問
				</a>
			</nav>
			<p>© {SITE_NAME}</p>
		</div>
	</footer>
);
