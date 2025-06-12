import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";

export const metadata: Metadata = {
	title: "葬儀会社向け管理システム | 香典帳",
	description:
		"葬儀会社向けの総合管理システム。顧客管理から案件管理、参列者・香典情報まで一元管理できます。",
};

export default function FuneralManagementPage() {
	const features = [
		{
			title: "顧客管理",
			description: "顧客情報を一元管理し、コミュニケーション履歴も記録できます。",
			href: "/enterprise/funeral-management/customers",
		},
		{
			title: "案件管理",
			description: "葬儀の案件情報を詳細に記録し、進捗状況を管理します。",
			href: "/enterprise/funeral-management/cases",
		},
		{
			title: "参列者管理",
			description: "参列者の情報や出欠状況、席次などを効率的に管理します。",
			href: "/enterprise/funeral-management/attendees",
		},
		{
			title: "香典受付記録",
			description: "香典情報をデジタルで記録し、返礼品の管理までサポートします。",
			href: "/enterprise/funeral-management/donations",
		},
		{
			title: "見積管理",
			description: "葬儀プランの見積作成から提案までを効率化します。",
			href: "/enterprise/funeral-management/quotes",
		},
	];

	return (
		<>
			<PageHero
				title="葬儀会社向け管理システム"
				subtitle="顧客情報から案件管理、参列者・香典情報まで一元管理できるクラウドシステム"
				cta={{
					label: "無料デモを申し込む",
					href: "/contact",
					icon: ChevronRight,
				}}
				className="bg-gradient-to-br from-gray-50 to-gray-100"
			/>

			<Section>
				<SectionTitle
					title="葬儀業務をトータルサポート"
					subtitle="あらゆる業務プロセスを効率化し、顧客満足度向上をお手伝いします"
				/>

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
					{features.map((feature) => (
						<Link
							key={feature.title}
							href={feature.href}
							className="group block p-4 sm:p-6 rounded-lg border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
						>
							<h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 group-hover:text-primary transition-colors">
								{feature.title}
							</h3>
							<p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">
								{feature.description}
							</p>
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
