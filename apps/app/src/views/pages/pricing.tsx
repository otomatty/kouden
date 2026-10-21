import { FREE_GIFT_LIMIT, PAID_PRICE_JPY, formatYen } from "@kouden/domain";
import type { FC } from "hono/jsx";
import { ui } from "../ui.ts";

const COMMON = [
	"受付番号の自動採番",
	"家族・親族との共同編集（招待リンク）",
	"香典返しの提案・管理",
	"印刷用ページ・Excel 出力",
	"変更履歴",
];

export const PricingPage: FC = () => (
	<div class={`${ui.container} space-y-8`}>
		<h1 class={ui.h1}>料金</h1>
		<p class="text-muted">料金は香典帳 1 冊ごとにかかります。月額料金はありません。</p>
		<div class="grid gap-4 sm:grid-cols-2">
			<section class={ui.card}>
				<h2 class={ui.h2}>無料</h2>
				<p class="mt-2 text-3xl font-semibold">{formatYen(0)}</p>
				<p class="mt-2 text-sm text-muted">いただきもの {FREE_GIFT_LIMIT} 件まで</p>
				<FeatureList />
			</section>
			<section class={`${ui.card} border-accent`}>
				<h2 class={ui.h2}>有料（買い切り）</h2>
				<p class="mt-2 text-3xl font-semibold">
					{formatYen(PAID_PRICE_JPY)}
					<span class="ml-1 text-sm font-normal text-muted">/ 1 冊（税込）</span>
				</p>
				<p class="mt-2 text-sm text-muted">いただきものの件数 無制限</p>
				<FeatureList />
			</section>
		</div>
		<p class="text-sm text-muted">
			有料版には、その香典帳のすべての行事（通夜・告別式・四十九日・一周忌など）が含まれます。お支払いはクレジットカード（Stripe）で、香典帳のオーナーが行います。
		</p>
	</div>
);

const FeatureList: FC = () => (
	<ul class="mt-6 space-y-2 text-sm">
		{COMMON.map((item) => (
			<li class="flex gap-2">
				<span aria-hidden="true" class="text-accent">
					✓
				</span>
				{item}
			</li>
		))}
	</ul>
);
