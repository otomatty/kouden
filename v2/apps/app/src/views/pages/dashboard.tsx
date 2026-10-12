import type { FC } from "hono/jsx";
import type { SessionUser } from "../../auth/session-store.ts";
import { ui } from "../ui.ts";

/** 香典帳一覧。香典帳の作成・一覧は M1 で実装する */
export const DashboardPage: FC<{ user: SessionUser }> = ({ user }) => (
	<div class={`${ui.container} space-y-8`}>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h1 class={ui.h1}>香典帳</h1>
		</div>
		<div class={`${ui.card} py-12 text-center`}>
			<p class="font-medium">まだ香典帳がありません</p>
			<p class="mt-2 text-sm text-muted">香典帳の作成は近日中に利用できるようになります。</p>
		</div>
		<section class={`${ui.card} space-y-4`} aria-labelledby="account">
			<h2 id="account" class={ui.h2}>
				アカウント
			</h2>
			<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
				<dt class="text-muted">表示名</dt>
				<dd>{user.displayName}</dd>
				<dt class="text-muted">メールアドレス</dt>
				<dd class="break-all">{user.email}</dd>
			</dl>
			<form method="post" action="/logout/all">
				<button type="submit" class={ui.buttonSecondary}>
					すべての端末からログアウト
				</button>
			</form>
		</section>
	</div>
);
