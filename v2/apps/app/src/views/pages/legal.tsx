import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";

/**
 * 規約類の仮ページ。
 * TODO(M0): 公開前に正式な文面へ差し替える（文面は運営者が用意する）。
 */
export const LegalPlaceholderPage: FC<{ title: string }> = ({ title }) => (
	<div class={`${ui.container} max-w-3xl space-y-6`}>
		<h1 class={ui.h1}>{title}</h1>
		<div class={`${ui.card} ${ui.prose}`}>
			<p>このページは準備中です。サービスの公開前に正式な内容を掲載します。</p>
		</div>
	</div>
);
