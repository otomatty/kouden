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
	title: "顧客管理 | ギフトショップ向け管理システム",
	description:
		"ギフトショップ向け管理システムの顧客管理機能。顧客情報の一元管理とセグメンテーション機能を提供。",
};

export default function CustomersPage() {
	const features = [
		{
			title: "顧客プロファイル管理",
			description:
				"名前・連絡先・誕生日・購入履歴などの顧客情報を一元管理。重要な情報に素早くアクセスできます。",
		},
		{
			title: "顧客セグメンテーション",
			description:
				"購買行動や好みに基づいてお客様をグループ化し、効果的なマーケティング戦略を立案できます。",
		},
		{
			title: "購買履歴分析",
			description:
				"お客様の購入パターンや好みを分析し、パーソナライズされたサービスを提供できます。",
		},
		{
			title: "メモ・タグ機能",
			description: "顧客ごとに特記事項やタグを付けて管理。特別なケアが必要なお客様も見逃しません。",
		},
		{
			title: "バースデー通知機能",
			description:
				"顧客の誕生日が近づくと自動通知。バースデーギフトや特別クーポンの送付タイミングを逃しません。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/gift-shop/customers.png",
		alt: "ギフトショップ向け顧客管理画面",
		caption: "顧客情報と購買履歴の管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="顧客管理（CRM）"
				subtitle="顧客情報を一元管理し、パーソナライズされた体験を提供"
				contentTitle="顧客との絆を深める"
				contentSubtitle="一人ひとりに合わせたサービス提供"
				imagePosition="right"
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
						{ title: "在庫管理", href: "/enterprise/gift-management/inventory" },
						{ title: "注文管理", href: "/enterprise/gift-management/orders" },
						{ title: "ロイヤルティ管理", href: "/enterprise/gift-management/loyalty" },
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
