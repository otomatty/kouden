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
	title: "香典受付記録 | 葬儀会社向け管理システム",
	description:
		"葬儀会社向け管理システムの香典受付記録機能。香典の受付から返礼品の管理まで一連の流れを効率化します。",
};

export default function DonationsPage() {
	const features = [
		{
			title: "香典情報の簡単登録",
			description:
				"香典情報（金額、贈り主、故人との関係など）を簡単に登録でき、後の返礼対応を効率化します。",
		},
		{
			title: "QRコード受付対応",
			description:
				"QRコードを活用した受付システムに対応し、デジタルでの香典受付をスムーズに行えます。",
		},
		{
			title: "返礼品管理連携",
			description:
				"香典額に応じた適切な返礼品の選定をサポート。地域の相場なども考慮した提案が可能です。",
		},
		{
			title: "集計・分析機能",
			description: "香典の総額や内訳を自動集計。統計情報を基に的確な返礼品の手配を支援します。",
		},
		{
			title: "御礼状作成支援",
			description: "香典データを基に御礼状の宛名や内容を自動生成。印刷用データの出力も可能です。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/funeral-management/donations.png",
		alt: "香典受付記録画面",
		caption: "香典情報の登録と管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="香典受付記録"
				subtitle="香典の受付から返礼品の手配まで一元管理"
				contentTitle="香典管理のデジタル化"
				contentSubtitle="手書き作業からの解放と正確な記録"
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
						{ title: "顧客管理", href: "/enterprise/funeral-management/customers" },
						{ title: "案件管理", href: "/enterprise/funeral-management/cases" },
						{ title: "参列者管理", href: "/enterprise/funeral-management/attendees" },
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
