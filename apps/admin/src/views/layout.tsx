import { ui } from "@kouden/ui";
import { raw } from "hono/html";
import type { Child, FC } from "hono/jsx";

const NAV = [
	{ path: "/", label: "ダッシュボード" },
	{ path: "/search", label: "検索" },
	{ path: "/legacy", label: "旧ユーザーの紐づけ" },
	{ path: "/audit", label: "監査ログ" },
] as const;

/** 運営者画面の共通枠。差出人の個人情報は表示しない（E10-1） */
export const AdminLayout: FC<{
	title: string;
	adminEmail: string;
	current?: string;
	children?: Child;
}> = ({ title, adminEmail, current, children }) => (
	<>
		{raw("<!DOCTYPE html>")}
		<html lang="ja">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="robots" content="noindex" />
				<title>{`${title} | 香典帳 運営者画面`}</title>
				<link rel="icon" href="data:," />
				<link rel="stylesheet" href={`/assets/admin.css?v=${__ASSET_VERSION__}`} />
			</head>
			<body class="min-h-dvh bg-paper font-sans text-ink antialiased">
				<a href="#main" class={ui.skipLink}>
					本文へ移動
				</a>
				<header class="border-b border-line bg-ink text-surface">
					<div class={`${ui.containerWide} flex h-14 items-center justify-between gap-4`}>
						<span class="font-semibold tracking-widest">香典帳 運営者画面</span>
						<span class="text-sm opacity-80">{adminEmail}</span>
					</div>
				</header>
				<nav aria-label="運営者画面のメニュー" class="border-b border-line bg-surface">
					<ul class={`${ui.containerWide} flex flex-wrap gap-1`}>
						{NAV.map((n) => (
							<li>
								<a
									href={n.path}
									aria-current={current === n.path ? "page" : undefined}
									class={`block border-b-2 px-4 py-2 text-sm ${
										current === n.path
											? "border-accent font-medium"
											: "border-transparent text-muted hover:text-ink"
									}`}
								>
									{n.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
				<main
					id="main"
					tabindex={-1}
					class={`${ui.containerWide} space-y-6 py-8 focus:outline-none`}
				>
					<h1 class={ui.h1}>{title}</h1>
					{children}
				</main>
			</body>
		</html>
	</>
);

export const Notice: FC<{ notice?: string | undefined; error?: string | undefined }> = ({
	notice,
	error,
}) => (
	<>
		{error && (
			<p role="alert" class={ui.alert}>
				{error}
			</p>
		)}
		{notice && (
			<p role="status" class={ui.notice}>
				{notice}
			</p>
		)}
	</>
);

const dateTime = new Intl.DateTimeFormat("ja-JP", {
	timeZone: "Asia/Tokyo",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
});

/** ISO 日時 → 日本時間の「2026/10/12 14:05」 */
export function formatDateTime(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? iso : dateTime.format(d);
}
