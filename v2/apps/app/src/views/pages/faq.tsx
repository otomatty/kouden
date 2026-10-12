import { FREE_GIFT_LIMIT } from "@kouden/domain";
import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";

const FAQ = [
	{
		q: "ログインには何が必要ですか？",
		a: "Google アカウントが必要です。パスワードの登録やメールでの確認はありません。",
	},
	{
		q: "以前メールアドレスでログインしていました。データはどうなりますか？",
		a: "以前のアドレスが Gmail または Google Workspace のアドレスなら、同じアドレスの Google アカウントでログインすると自動で以前のデータにつながります。それ以外のアドレス（携帯キャリアやプロバイダのメールなど）だった場合や、別のアドレスの Google アカウントを使う場合は、お問い合わせください。運営者が確認のうえ紐づけます。",
	},
	{
		q: "無料でどこまで使えますか？",
		a: `香典帳 1 冊につき、いただきもの（香典・供物・供花・弔電）${FREE_GIFT_LIMIT} 件まで、すべての機能を無料でお使いいただけます。`,
	},
	{
		q: "家族と一緒に使えますか？",
		a: "招待リンクを送るだけで参加できます。参加者ごとに「編集者」「閲覧者」の権限を選べます。",
	},
	{
		q: "電波の弱い会場でも使えますか？",
		a: "通信が切れると画面に警告が表示され、送信できなくなります。通信が戻ってから入力を続けてください。",
	},
] as const;

export const FaqPage: FC = () => (
	<div class={`${ui.container} max-w-3xl space-y-8`}>
		<h1 class={ui.h1}>よくある質問</h1>
		<div class="divide-y divide-line rounded-xl border border-line bg-surface">
			{FAQ.map((item) => (
				<details class="group p-5">
					<summary class="cursor-pointer list-none font-medium">
						<span class="mr-2 text-accent">Q.</span>
						{item.q}
					</summary>
					<p class="mt-3 leading-relaxed text-muted">{item.a}</p>
				</details>
			))}
		</div>
	</div>
);
