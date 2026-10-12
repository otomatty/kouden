import { FREE_GIFT_LIMIT, PAID_PRICE_JPY, formatYen } from "@kouden/domain";
import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";

const FEATURES = [
	{
		title: "受付で、何人でも同時に入力",
		body: "スマホで芳名と金額を登録すると受付番号が表示されます。複数の受付係が同時に入力しても番号は重なりません。",
	},
	{
		title: "家族とリアルタイムに共有",
		body: "招待リンクを LINE などで送るだけで参加できます。入力された内容は、家族の画面にすぐ反映されます。",
	},
	{
		title: "香典返しまでまとめて管理",
		body: "金額に応じた返礼品の提案、手配・発送状況の管理、四十九日前のお知らせメールまで対応します。",
	},
	{
		title: "印刷と Excel 出力",
		body: "芳名一覧や宛名一覧を A4 で印刷できます。Excel 形式でのダウンロードにも対応しています。",
	},
] as const;

export const HomePage: FC = () => (
	<div class="space-y-16 sm:space-y-24">
		<section class={`${ui.container} pt-4 text-center sm:pt-12`}>
			<p class="text-sm tracking-[0.3em] text-muted">葬儀・法要の記録に</p>
			<h1 class="mt-4 text-3xl leading-snug font-semibold tracking-wide sm:text-5xl">
				<span class="inline-block">香典帳を、</span>
				<span class="inline-block">家族みんなで。</span>
			</h1>
			<p class="mx-auto mt-6 max-w-2xl leading-relaxed text-muted">
				葬儀の受付から香典返しまで。香典・供物・弔電をスマホで記録し、家族とリアルタイムに共有できます。
			</p>
			<div class="mt-10 flex flex-col items-center gap-3">
				<a href="/login" class={ui.buttonPrimary}>
					Google アカウントで始める
				</a>
				<p class="text-sm text-muted">{FREE_GIFT_LIMIT} 件まで無料でお使いいただけます</p>
			</div>
		</section>

		<section class={ui.container} aria-labelledby="features">
			<h2 id="features" class={`${ui.h2} text-center`}>
				できること
			</h2>
			<ul class="mt-8 grid gap-4 sm:grid-cols-2">
				{FEATURES.map((f) => (
					<li class={ui.card}>
						<h3 class="font-semibold">{f.title}</h3>
						<p class="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
					</li>
				))}
			</ul>
		</section>

		<section class={`${ui.container} text-center`} aria-labelledby="price">
			<h2 id="price" class={ui.h2}>
				料金
			</h2>
			<p class="mt-4 leading-relaxed text-muted">
				香典帳 1 冊につき {FREE_GIFT_LIMIT} 件までは無料です。
				<br class="hidden sm:inline" />
				それ以上は 1 冊 {formatYen(PAID_PRICE_JPY)}（税込・買い切り）で件数の制限がなくなります。
			</p>
			<a href="/pricing" class={`${ui.link} mt-4 inline-block`}>
				料金の詳細
			</a>
		</section>
	</div>
);
