/** 共通のクラス名（利用者向けアプリと運営者画面で共有する）。CSS の色などは theme.css */
export const ui = {
	container: "mx-auto w-full max-w-5xl px-4 sm:px-6",
	containerWide: "mx-auto w-full max-w-7xl px-4 sm:px-6",
	buttonPrimary:
		"inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-medium text-surface shadow-sm transition-colors hover:bg-accent/85 disabled:opacity-50",
	/** Google でログインするボタン（利用者向けアプリの GoogleButton が Google のロゴと合わせて使う） */
	buttonGoogle:
		"inline-flex items-center justify-center gap-3 rounded-lg border border-google-line bg-google px-5 py-3 text-base font-medium text-google-text transition-colors hover:bg-google/85",
	buttonSecondary:
		"inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50",
	buttonSmall:
		"inline-flex items-center justify-center rounded-md border border-line bg-surface px-2.5 py-1 text-sm whitespace-nowrap text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40",
	buttonDanger:
		"inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-surface transition-colors hover:opacity-90 disabled:opacity-50",
	link: "text-accent underline underline-offset-4 hover:decoration-2",
	card: "rounded-xl border border-line bg-surface p-6 shadow-sm",
	cardTight: "rounded-xl border border-line bg-surface p-4 shadow-sm",
	/** 目立たせたいカード（招待リンク・登録した番号など、いま見てほしいもの） */
	cardEmphasis: "rounded-xl border-2 border-accent bg-surface p-6",
	h1: "text-2xl font-semibold tracking-wide sm:text-3xl",
	h2: "text-xl font-semibold tracking-wide",
	h3: "font-semibold",
	prose: "space-y-4 leading-relaxed",
	input:
		"block w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:border-accent aria-[invalid=true]:border-danger",
	label: "block text-sm font-medium",
	table: "w-full border-collapse text-sm",
	th: "border-b border-line px-3 py-2 text-left font-medium whitespace-nowrap text-muted",
	td: "border-b border-line px-3 py-2 align-top",
	badge: "inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-muted",
	badgeInk: "inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-ink",
	badgeAccent: "inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent",
	badgeDanger: "inline-block rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger",
	notice: "rounded-lg border border-line bg-surface px-4 py-3 text-sm",
	noticeEmphasis: "rounded-lg border-2 border-accent bg-surface px-4 py-3 text-sm",
	alert: "rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger",
	/** キーボード操作でだけ現れる「本文へ移動」のリンク */
	skipLink:
		"sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow",
} as const;
