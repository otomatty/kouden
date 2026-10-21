import type { FC } from "hono/jsx";
import { ui } from "@kouden/ui";

const MESSAGES = {
	403: ["この操作はできません", "閲覧のみの権限か、アーカイブ中の香典帳です。"],
	404: ["ページが見つかりません", "URL が正しいかご確認ください。"],
	410: [
		"この招待リンクは使えません",
		"新しい香典帳への切り替えで、以前の招待リンクは無効になりました。香典帳のオーナーに招待リンクを作り直してもらってください。",
	],
	429: ["操作が多すぎます", "しばらく待ってからもう一度お試しください。"],
	500: [
		"エラーが発生しました",
		"時間をおいてもう一度お試しください。解決しない場合は、下記の番号を添えてお問い合わせください。",
	],
} as const;

export const ErrorPage: FC<{ status: keyof typeof MESSAGES; requestId?: string }> = ({
	status,
	requestId,
}) => (
	<div class={`${ui.container} max-w-md text-center`}>
		<p class="text-5xl font-semibold text-muted">{status}</p>
		<h1 class={`${ui.h1} mt-4`}>{MESSAGES[status][0]}</h1>
		<p class="mt-4 text-muted">{MESSAGES[status][1]}</p>
		{status === 500 && requestId ? (
			<p class="mt-2 font-mono text-xs text-muted">{requestId}</p>
		) : null}
		<a href="/" class={`${ui.link} mt-8 inline-block`}>
			トップへ戻る
		</a>
	</div>
);
