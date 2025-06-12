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
	title: "葬儀案件管理 | 葬儀会社向け管理システム",
	description:
		"葬儀会社向け管理システムの案件管理機能。葬儀の案件情報を一元管理し、ステータス追跡が可能。",
};

export default function CasesPage() {
	const features = [
		{
			title: "葬儀情報の一元管理",
			description:
				"故人情報、日程、会場、プラン詳細など葬儀に関するすべての情報を一元管理できます。",
		},
		{
			title: "ステータス管理",
			description: "案件の進行状況をステータスで管理し、チーム全体で現在の状況を共有できます。",
		},
		{
			title: "担当者アサイン",
			description:
				"案件ごとに担当者をアサインし、責任の所在を明確にします。複数担当者の設定も可能です。",
		},
		{
			title: "タイムライン表示",
			description: "案件の進行状況や変更履歴をタイムラインで確認できます。",
		},
		{
			title: "関連情報の紐付け",
			description:
				"参列者情報や香典情報、タスクなど、関連する情報をすべて案件に紐付けて管理できます。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/funeral-management/cases.png",
		alt: "葬儀案件管理画面",
		caption: "葬儀案件の詳細情報とステータス管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="葬儀案件管理"
				subtitle="葬儀に関する情報をすべて一元管理し、スムーズな進行をサポート"
				contentTitle="効率的な案件管理"
				contentSubtitle="葬儀のすべてのプロセスを管理"
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
