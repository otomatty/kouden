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
	title: "ロイヤルティ管理 | ギフトショップ向け管理システム",
	description:
		"ギフトショップ向け管理システムのロイヤルティ管理機能。ポイント管理や会員ランクなどの特典を管理。",
};

export default function LoyaltyPage() {
	const features = [
		{
			title: "ポイントプログラム管理",
			description:
				"購入金額に応じたポイント付与や特別ボーナスポイントなど、柔軟なポイントプログラムを設計・管理できます。",
		},
		{
			title: "会員ランク設定",
			description:
				"購入実績に基づく会員ランク（ブロンズ、シルバー、ゴールドなど）を設定し、ランクに応じた特典を提供できます。",
		},
		{
			title: "特典クーポン発行",
			description:
				"誕生日や記念日、ポイント達成などのタイミングで自動的に特典クーポンを発行し、顧客満足度を高めます。",
		},
		{
			title: "リファラルプログラム",
			description:
				"既存顧客からの紹介を促進するリファラルプログラムを管理。紹介者と新規顧客双方に特典を提供できます。",
		},
		{
			title: "ロイヤルティ分析",
			description:
				"ポイントプログラムやランク特典の効果を分析し、より効果的なロイヤルティ戦略の構築を支援します。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/gift-shop/loyalty.png",
		alt: "ロイヤルティ管理画面",
		caption: "ポイント管理と会員ランク設定画面",
	};

	return (
		<>
			<DetailPageLayout
				title="ロイヤルティプログラム"
				subtitle="顧客のリピート購入を促進する効果的なロイヤルティ管理"
				contentTitle="顧客ロイヤルティの向上"
				contentSubtitle="リピーターを増やし、顧客生涯価値を最大化"
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
						{ title: "マーケティング管理", href: "/enterprise/gift-management/marketing" },
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
