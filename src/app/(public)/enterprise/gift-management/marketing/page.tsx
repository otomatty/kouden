import type { Metadata } from "next";
import { FeatureDescription } from "../_components/feature-description";
import { ScreenshotShowcase } from "../_components/screenshot-showcase";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { DetailPageLayout } from "../../_components/detail-page-layout";

export const metadata: Metadata = {
	title: "マーケティング管理 | ギフトショップ向け管理システム",
	description:
		"ギフトショップ向け管理システムのマーケティング管理機能。キャンペーン管理やメール配信など効果的なマーケティングを実現。",
};

export default function MarketingPage() {
	const features = [
		{
			title: "キャンペーン管理",
			description:
				"季節イベントやプロモーションなどのキャンペーンを計画から実行まで一元管理。効果測定も簡単に行えます。",
		},
		{
			title: "メール/SMSマーケティング",
			description:
				"顧客セグメント別にカスタマイズされたメールやSMSを配信。テンプレート機能で効率的にコンテンツを作成できます。",
		},
		{
			title: "パーソナライズ機能",
			description:
				"顧客の購買履歴や好みに基づいて、一人ひとりに最適化されたレコメンデーションを提供します。",
		},
		{
			title: "A/Bテスト機能",
			description:
				"メールの件名やコンテンツを複数パターン用意し、効果を比較測定。より高い成果を生むアプローチを発見できます。",
		},
		{
			title: "マーケティング効果分析",
			description:
				"キャンペーンの反応率や売上貢献度などを分析し、次回のマーケティング戦略に活かせるインサイトを提供します。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/gift-shop/marketing.png",
		alt: "マーケティング管理画面",
		caption: "キャンペーン管理とメール配信設定画面",
	};

	return (
		<>
			<DetailPageLayout
				title="マーケティング管理"
				subtitle="効果的なキャンペーンとパーソナライズされた顧客体験の提供"
				contentTitle="戦略的マーケティング"
				contentSubtitle="売上向上につながる効果的なプロモーション展開"
				imagePosition="left"
			>
				<ScreenshotShowcase {...screenshotDetails} />
				<FeatureDescription features={features} />
			</DetailPageLayout>
			<Section className="mt-16">
				<SectionTitle
					title="その他の機能"
					subtitle="ギフトショップ向け管理システムの他の機能もご覧ください"
				/>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12">
					{[
						{ title: "顧客管理", href: "/enterprise/gift-management/customers" },
						{ title: "在庫管理", href: "/enterprise/gift-management/inventory" },
						{ title: "注文管理", href: "/enterprise/gift-management/orders" },
						{ title: "ロイヤルティ管理", href: "/enterprise/gift-management/loyalty" },
					].map((feature) => (
						<Link
							key={feature.href}
							href={feature.href}
							className="group block p-4 sm:p-6 rounded-lg border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
						>
							<h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 group-hover:text-primary transition-colors">
								{feature.title}
							</h3>
							<Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10">
								詳細を見る
								<ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
							</Button>
						</Link>
					))}
				</div>
			</Section>
		</>
	);
}
