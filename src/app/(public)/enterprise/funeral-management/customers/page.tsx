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
	title: "顧客管理 | 葬儀会社向け管理システム",
	description:
		"葬儀会社向け管理システムの顧客管理機能。顧客情報の一元管理とコミュニケーション履歴を記録。",
};

export default function CustomersPage() {
	const features = [
		{
			title: "顧客情報の一元管理",
			description:
				"基本情報から詳細な属性（宗派・アレルギーなど）まで一元管理。必要な情報にすぐにアクセス可能です。",
		},
		{
			title: "コミュニケーション履歴",
			description:
				"問い合わせから契約、施行後のフォローまで、すべてのコミュニケーション履歴を時系列で管理します。",
		},
		{
			title: "カスタム属性設定",
			description: "御社独自の顧客属性を自由に設定可能。必要な情報を柔軟に管理できます。",
		},
		{
			title: "検索・フィルタリング機能",
			description:
				"複数条件での検索やフィルタリングにより、必要な顧客情報にすぐにアクセスできます。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/funeral-management/customers.png",
		alt: "葬儀会社向け顧客管理画面",
		caption: "顧客情報を一覧表示した管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="顧客管理（CRM）"
				subtitle="問い合わせから施行後フォローまで一元管理できる顧客管理システム"
				contentTitle="顧客情報を一元管理"
				contentSubtitle="すべての顧客情報に素早くアクセス"
				imagePosition="right"
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
						{ title: "案件管理", href: "/enterprise/funeral-management/cases" },
						{ title: "参列者管理", href: "/enterprise/funeral-management/attendees" },
						{ title: "香典受付記録", href: "/enterprise/funeral-management/donations" },
						{ title: "見積管理", href: "/enterprise/funeral-management/quotes" },
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
