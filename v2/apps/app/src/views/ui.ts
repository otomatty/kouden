/** 共通のクラス名。部品が増えたら packages/ui に切り出す */
export const ui = {
	container: "mx-auto w-full max-w-5xl px-4 sm:px-6",
	buttonPrimary:
		"inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-accent-strong disabled:opacity-50",
	buttonSecondary:
		"inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper",
	link: "text-accent underline underline-offset-4 hover:text-accent-strong",
	card: "rounded-xl border border-line bg-surface p-6 shadow-sm",
	h1: "text-2xl font-semibold tracking-wide sm:text-3xl",
	h2: "text-xl font-semibold tracking-wide",
	prose: "space-y-4 leading-relaxed",
} as const;
