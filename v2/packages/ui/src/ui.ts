/** 共通のクラス名（利用者向けアプリと運営者画面で共有する）。CSS の色などは theme.css */
export const ui = {
	container: "mx-auto w-full max-w-5xl px-4 sm:px-6",
	containerWide: "mx-auto w-full max-w-7xl px-4 sm:px-6",
	buttonPrimary:
		"inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-accent-strong disabled:opacity-50",
	buttonSecondary:
		"inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50",
	buttonSmall:
		"inline-flex items-center justify-center rounded-md border border-line bg-surface px-2.5 py-1 text-sm whitespace-nowrap text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40",
	buttonDanger:
		"inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50",
	link: "text-accent underline underline-offset-4 hover:text-accent-strong",
	card: "rounded-xl border border-line bg-surface p-6 shadow-sm",
	cardTight: "rounded-xl border border-line bg-surface p-4 shadow-sm",
	h1: "text-2xl font-semibold tracking-wide sm:text-3xl",
	h2: "text-xl font-semibold tracking-wide",
	h3: "font-semibold",
	prose: "space-y-4 leading-relaxed",
	input:
		"block w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger",
	label: "block text-sm font-medium",
	table: "w-full border-collapse text-sm",
	th: "border-b border-line px-3 py-2 text-left font-medium whitespace-nowrap text-muted",
	td: "border-b border-line px-3 py-2 align-top",
	badge: "inline-block rounded-full bg-paper px-2 py-0.5 text-xs text-muted",
	notice: "rounded-lg border border-line bg-surface px-4 py-3 text-sm",
	alert: "rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger",
} as const;
