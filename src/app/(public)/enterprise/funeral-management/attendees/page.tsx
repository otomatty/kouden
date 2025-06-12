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
	title: "参列者管理 | 葬儀会社向け管理システム",
	description:
		"葬儀会社向け管理システムの参列者管理機能。参列者情報の登録、出欠確認、席次管理などが可能です。",
};

export default function AttendeesPage() {
	const features = [
		{
			title: "参列者情報の一元管理",
			description:
				"参列者の名前、連絡先、故人との関係性などの情報を一元管理し、スムーズな参列者対応を実現します。",
		},
		{
			title: "出欠確認機能",
			description:
				"参列者の出欠状況をリアルタイムで管理。連絡済み/未連絡/出席/欠席などのステータスで一目で確認できます。",
		},
		{
			title: "席次管理",
			description: "席次表の作成と管理が簡単に。参列者の関係性に基づいて最適な席配置を支援します。",
		},
		{
			title: "香典・供物管理との連携",
			description:
				"参列者からの香典や供物の情報と連携し、後日の礼状送付などの業務をサポートします。",
		},
		{
			title: "一括インポート/エクスポート",
			description:
				"CSVなどの形式で参列者情報を一括登録したり、データをエクスポートしたりすることができます。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/funeral-management/attendees.png",
		alt: "参列者管理画面",
		caption: "参列者一覧と出欠管理の画面",
	};

	return (
		<>
			<DetailPageLayout
				title="参列者管理"
				subtitle="参列者情報を効率的に管理し、円滑な葬儀運営をサポート"
				contentTitle="参列者情報の管理"
				contentSubtitle="きめ細かな対応で遺族と参列者の満足度向上"
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
