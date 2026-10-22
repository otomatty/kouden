import type { Child, FC } from "hono/jsx";

/**
 * 一覧が空のときの表示（利用者向けアプリと運営者画面で共有する）。
 * 何がないのか（title）、どうすれば並ぶのか（description）、次の操作（children のリンク・ボタン）を出す。
 * compact はカードの中の小さな一覧（返礼品カタログ・香典返しの品など）に使う。
 */
export const EmptyState: FC<{
	title: string;
	description?: Child;
	compact?: boolean;
	children?: Child;
}> = ({ title, description, compact, children }) => (
	<div
		class={`rounded-xl border border-dashed border-line bg-surface text-center ${
			compact ? "px-4 py-6" : "px-6 py-12"
		}`}
	>
		<p class="font-medium text-ink">{title}</p>
		{description && (
			<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
		)}
		{children && (
			<div class="mt-5 flex flex-wrap items-center justify-center gap-3">{children}</div>
		)}
	</div>
);
