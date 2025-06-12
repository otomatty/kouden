import type { Metadata } from "next";
import { FeatureDescription } from "../_components/feature-description";
import { ScreenshotShowcase } from "../_components/screenshot-showcase";
import { DetailPageLayout } from "../../_components/detail-page-layout";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "見積管理 | 葬儀会社向け管理システム",
	description:
		"葬儀会社向け管理システムの見積管理機能。葬儀プランの見積作成から提案、PDF出力まで対応します。",
};

export default function QuotesPage() {
	const features = [
		{
			title: "テンプレート活用",
			description:
				"定型の葬儀プランをテンプレート化し、素早く見積を作成。カスタマイズも簡単に行えます。",
		},
		{
			title: "オプション項目の柔軟な追加",
			description:
				"祭壇や返礼品など、オプション項目を柔軟に追加・削除でき、お客様のニーズに合わせた見積を作成できます。",
		},
		{
			title: "料金自動計算",
			description:
				"項目の追加や変更に応じて料金が自動計算され、計算ミスを防止します。消費税の自動計算も対応。",
		},
		{
			title: "PDF出力機能",
			description:
				"作成した見積書はPDF形式で出力可能。メールでの送付やプリントアウトに対応しています。",
		},
		{
			title: "見積履歴管理",
			description:
				"複数バージョンの見積履歴を管理し、変更内容を比較できます。お客様との商談履歴も記録可能です。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/funeral-management/quotes.png",
		alt: "見積管理画面",
		caption: "葬儀プランの見積作成画面",
	};

	return (
		<>
			<DetailPageLayout
				title="見積管理"
				subtitle="葬儀プランの見積作成から提案までをサポート"
				contentTitle="スムーズな見積提案"
				contentSubtitle="お客様のニーズに合わせた最適なプラン提案"
				imagePosition="left"
			>
				<ScreenshotShowcase {...screenshotDetails} />
				<FeatureDescription features={features} />
			</DetailPageLayout>
			<Section className="mt-16">
				<SectionTitle
					title="その他の機能"
					subtitle="葬儀会社向け管理システムの他の機能もご覧ください"
				/>
				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12">
					{[
						{ title: "顧客管理", href: "/enterprise/funeral-management/customers" },
						{ title: "案件管理", href: "/enterprise/funeral-management/cases" },
						{ title: "参列者管理", href: "/enterprise/funeral-management/attendees" },
						{ title: "香典受付記録", href: "/enterprise/funeral-management/donations" },
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
