import { raw } from "hono/html";
import type { Child, FC } from "hono/jsx";
import type { SessionUser } from "../auth/session-store.ts";
import { UserMenu, ui } from "@kouden/ui";

const SITE_NAME = "香典帳";

const HTMX_CONFIG = JSON.stringify({
	selfRequestsOnly: true,
	allowEval: false,
	allowScriptTags: false,
	includeIndicatorStyles: false,
	historyCacheSize: 0,
	responseHandling: [
		{ code: "204", swap: false },
		{ code: "[23]..", swap: true },
		{ code: "409", swap: true },
		{ code: "422", swap: true },
		{ code: "[45]..", swap: false, error: true },
	],
});

export const Layout: FC<{
	title?: string;
	description?: string;
	user: SessionUser | null;
	/** ヘッダーの「ログイン」を出さない（ログイン画面では同じ操作が並ぶため） */
	hideLoginLink?: boolean;
	children?: Child;
}> = ({ title, description, user, hideLoginLink, children }) => (
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
				{/* theme.css の --color-ink */}
				<meta name="theme-color" content="#2b2b2b" />
				{/* ファビコンは未作成。/favicon.ico への 404 を避ける */}
				<link rel="icon" href="data:," />
				<link rel="stylesheet" href={`/assets/app.css?v=${__ASSET_VERSION__}`} />
				{/* htmx の設定: 自分のオリジンにだけ要求する / eval を使わない（CSP）/ 422・409 も差し替える */}
				<meta name="htmx-config" content={HTMX_CONFIG} />
				<script src={`/assets/htmx.min.js?v=${__ASSET_VERSION__}`} defer></script>
				<script src={`/assets/app.js?v=${__ASSET_VERSION__}`} defer></script>
			</head>
			<body class="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
				<a href="#main" class={ui.skipLink}>
					本文へ移動
				</a>
				<Header user={user} hideLoginLink={hideLoginLink} />
				<main id="main" tabindex={-1} class="flex-1 py-8 focus:outline-none sm:py-12">
					{children}
				</main>
				<Footer />
			</body>
		</html>
	</>
);

const Header: FC<{ user: SessionUser | null; hideLoginLink?: boolean | undefined }> = ({
	user,
	hideLoginLink,
}) => (
	<header class="border-b border-line bg-surface">
		<div class={`${ui.container} flex h-14 items-center justify-between`}>
			<a href="/" class="text-lg font-semibold tracking-widest text-ink">
				{SITE_NAME}
			</a>
			<nav aria-label="アカウント" class="flex items-center gap-4 text-sm">
				{user ? (
					<UserMenu
						name={user.displayName}
						detail={user.email}
						avatarUrl={user.avatarUrl}
						settingsHref="/account"
						logout={{ action: "/logout" }}
					/>
				) : (
					<>
						<a href="/pricing" class="text-muted hover:text-ink">
							料金
						</a>
						<a href="/faq" class="hidden text-muted hover:text-ink sm:inline">
							よくある質問
						</a>
						{!hideLoginLink && (
							<a href="/login" class={ui.buttonSecondary}>
								ログイン
							</a>
						)}
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
			<nav aria-label="サイトの案内" class="flex flex-wrap gap-x-6 gap-y-2">
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
