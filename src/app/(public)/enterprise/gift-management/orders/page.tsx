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
	title: "注文管理 | ギフトショップ向け管理システム",
	description:
		"ギフトショップ向け管理システムの注文管理機能。注文の受付から出荷、配送追跡まで一元管理できます。",
};

export default function OrdersPage() {
	const features = [
		{
			title: "オムニチャネル注文管理",
			description:
				"実店舗、オンラインストア、電話注文など、あらゆる販売チャネルからの注文を一元管理できます。",
		},
		{
			title: "ステータス追跡",
			description:
				"注文受付から発送完了までのステータスをリアルタイムで追跡。スタッフ間で情報共有も簡単です。",
		},
		{
			title: "配送追跡連携",
			description:
				"主要配送会社のAPIと連携し、配送ステータスを自動取得。お客様への追跡情報提供も自動化できます。",
		},
		{
			title: "ギフトラッピング管理",
			description:
				"ラッピングオプションや熨斗・メッセージカードなどのギフト設定をきめ細かく管理できます。",
		},
		{
			title: "一括処理機能",
			description: "複数の注文を一括で処理。納品書の一括印刷や配送ラベルの一括作成が可能です。",
		},
		{
			title: "返品・交換管理",
			description:
				"返品や交換のリクエストを管理し、スムーズな対応を実現。在庫との連携も自動で行われます。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/gift-shop/orders.png",
		alt: "注文管理画面",
		caption: "注文一覧と詳細情報の管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="注文管理"
				subtitle="注文の受付から配送まで効率的にワンストップ管理"
				contentTitle="シームレスな注文処理"
				contentSubtitle="顧客満足度を高める迅速で正確な対応"
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
						{ title: "顧客管理", href: "/enterprise/gift-management/customers" },
						{ title: "在庫管理", href: "/enterprise/gift-management/inventory" },
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
