import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";

export const ErrorPage: FC<{ status: 404 | 500; requestId?: string }> = ({ status, requestId }) => (
	<div class={`${ui.container} max-w-md text-center`}>
		<p class="text-5xl font-semibold text-muted">{status}</p>
		<h1 class={`${ui.h1} mt-4`}>
			{status === 404 ? "ページが見つかりません" : "エラーが発生しました"}
		</h1>
		<p class="mt-4 text-muted">
			{status === 404
				? "URL が正しいかご確認ください。"
				: "時間をおいてもう一度お試しください。解決しない場合は、下記の番号を添えてお問い合わせください。"}
		</p>
		{status === 500 && requestId ? (
			<p class="mt-2 font-mono text-xs text-muted">{requestId}</p>
		) : null}
		<a href="/" class={`${ui.link} mt-8 inline-block`}>
			トップへ戻る
		</a>
	</div>
);
