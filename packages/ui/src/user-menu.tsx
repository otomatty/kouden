import type { FC } from "hono/jsx";

/**
 * ヘッダーのユーザーメニュー（利用者向けアプリと運営者画面で共有する）。アバターと名前を出し、押すと設定・ログアウトを開く。
 * <details> で開閉するので、スクリプトがなくても動く（運営者画面は script-src 'none'）。
 * 利用者向けアプリでは app.js が、外側のクリックと Esc で閉じる（data-user-menu）。
 */
export const UserMenu: FC<{
	name: string;
	/** 名前の下に出す補足（メールアドレス・「運営者」など） */
	detail?: string | undefined;
	/** Google のプロフィール画像。なければ名前の頭文字を出す */
	avatarUrl?: string | null | undefined;
	/** 「設定」の行き先。省略すると「設定」を出さない */
	settingsHref?: string | undefined;
	/** ログアウト。action は POST で送るフォーム、href はリンク（Cloudflare Access のログアウト） */
	logout: { action: string } | { href: string };
	/** ヘッダーの地の色（運営者画面は墨の地） */
	tone?: "light" | "dark";
}> = ({ name, detail, avatarUrl, settingsHref, logout, tone = "light" }) => {
	const item =
		"block w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-paper";
	return (
		<details data-user-menu class="group relative">
			<summary
				class={`flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors [&::-webkit-details-marker]:hidden ${
					tone === "dark" ? "hover:bg-surface/10" : "hover:bg-paper"
				}`}
			>
				<Avatar name={name} url={avatarUrl} tone={tone} />
				<span class="max-w-32 truncate text-sm sm:max-w-48">{name}</span>
				<svg
					viewBox="0 0 16 16"
					class="size-4 flex-none opacity-70 transition-transform group-open:rotate-180"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M4 6l4 4 4-4" />
				</svg>
			</summary>
			<div class="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-line bg-surface p-1 text-ink shadow-lg">
				<div class="border-b border-line px-3 pt-2 pb-3">
					<p class="truncate text-sm font-medium">{name}</p>
					{detail && <p class="truncate text-xs text-muted">{detail}</p>}
				</div>
				<ul class="pt-1">
					{settingsHref && (
						<li>
							<a href={settingsHref} class={item}>
								設定
							</a>
						</li>
					)}
					<li>
						{"action" in logout ? (
							<form method="post" action={logout.action}>
								<button type="submit" class={`${item} cursor-pointer`}>
									ログアウト
								</button>
							</form>
						) : (
							<a href={logout.href} class={item}>
								ログアウト
							</a>
						)}
					</li>
				</ul>
			</div>
		</details>
	);
};

/** アバター。名前が隣にあるので画像は飾り（alt=""） */
const Avatar: FC<{ name: string; url?: string | null | undefined; tone: "light" | "dark" }> = ({
	name,
	url,
	tone,
}) =>
	url ? (
		<img
			src={url}
			alt=""
			width={32}
			height={32}
			referrerpolicy="no-referrer"
			class="size-8 flex-none rounded-full border border-line bg-paper object-cover"
		/>
	) : (
		<span
			aria-hidden="true"
			class={`flex size-8 flex-none items-center justify-center rounded-full text-sm font-medium uppercase ${
				tone === "dark" ? "bg-surface text-ink" : "bg-accent text-surface"
			}`}
		>
			{Array.from(name.trim())[0] ?? "?"}
		</span>
	);
