import type { Metadata } from "next";
import { PageHero } from "../_components/page-hero";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
	title: "特定商取引法に基づく表記 | 香典帳",
	description: "香典帳アプリにおける特定商取引法に基づく表記について",
};

export default function LegalPage() {
	return (
		<div className="space-y-8 mb-24">
			<PageHero
				title="特定商取引法に基づく表記"
				subtitle="香典帳アプリにおける特定商取引法に基づく表記"
				className="bg-background"
			/>
			<Section className="py-8 px-4">
				<article className="prose prose-lg prose-gray">
					<Heading level={2}>販売業者</Heading>
					<p>Saedgewell</p>

					<Heading level={2}>運営統括責任者</Heading>
					<p>菅井 瑛正</p>

					<Heading level={2}>所在地</Heading>
					<p>〒022-0002 岩手県大船渡市大船渡町字明神前6-13</p>

					<Heading level={2}>電話番号</Heading>
					<p>080-9068-9306</p>

					<Heading level={2}>メールアドレス</Heading>
					<p>
						<a href="mailto:saedgewell@gmail.com">saedgewell@gmail.com</a>
					</p>

					<Heading level={2}>販売価格</Heading>
					<p>各商品ページに表示された価格とします。</p>

					<Heading level={2}>商品代金以外の必要料金</Heading>
					<ul className="list-disc list-inside space-y-2 mt-2 mb-4 text-muted-foreground">
						<li>消費税</li>
						<li>送料</li>
						<li>振込手数料</li>
					</ul>

					<Heading level={2}>支払方法</Heading>
					<p>クレジットカード、銀行振込</p>

					<Heading level={2}>支払期限</Heading>
					<p>注文後7日以内にお支払いください。</p>

					<Heading level={2}>返品・交換</Heading>
					<p>有料プラン購入後の返金は原則できません。</p>

					<Heading level={2}>役務の提供条件</Heading>
					<p>各サービスの提供条件は、個別の商品ページに記載された内容に従います。</p>

					<Heading level={2}>返品送料</Heading>
					<p>不良品の場合の返品送料は当社が負担します。</p>

					<Heading level={2}>キャンセル</Heading>
					<p>
						注文後のキャンセルは原則としてお受けできませんが、当社が特別に認めた場合には対応いたします。
					</p>

					<Heading level={2}>付則</Heading>
					<p>本表記は2025年6月1日より有効です。</p>
				</article>
			</Section>
		</div>
	);
}
