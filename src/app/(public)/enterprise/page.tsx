import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Smile, BarChart2, ShieldCheck } from "lucide-react";
import { PageHero } from "../_components/page-hero";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata: Metadata = {
	title: "企業向け機能 | 香典帳",
	description:
		"葬儀会社やギフトショップ向けの業務管理システム。お客様の業務効率化と顧客満足度向上を支援します。",
};

export default function EnterprisePage() {
	const solutions = [
		{
			title: "葬儀会社向け管理システム",
			description:
				"顧客管理から案件管理、参列者・香典情報まで一元管理できるクラウドシステム。業務効率化と顧客満足度向上を実現します。",
			imageSrc: "/screenshots/funeral-management/dashboard.png",
			href: "/enterprise/funeral-management",
		},
		{
			title: "ギフトショップ向け管理システム",
			description:
				"顧客管理から在庫、注文、ロイヤルティプログラムまで一元管理できるクラウドシステム。売上向上と顧客ロイヤルティ構築を支援します。",
			imageSrc: "/screenshots/gift-shop/dashboard.png",
			href: "/enterprise/gift-shop",
		},
	];

	const benefits = [
		{
			title: "業務効率の向上",
			description: "煩雑な業務プロセスをデジタル化し、スタッフの作業負担を軽減します。",
			icon: Zap,
		},
		{
			title: "顧客満足度の向上",
			description: "きめ細かな顧客対応を実現し、顧客体験を向上させます。",
			icon: Smile,
		},
		{
			title: "データに基づく意思決定",
			description: "蓄積されたデータを分析し、経営判断や業務改善に活かせます。",
			icon: BarChart2,
		},
		{
			title: "セキュリティ対策",
			description: "顧客情報などの重要データを安全に管理できます。",
			icon: ShieldCheck,
		},
	];

	return (
		<>
			<PageHero
				title="企業向け機能の紹介"
				subtitle="業種に特化した管理システムで業務効率化と売上向上を支援します"
				cta={{
					label: "お問い合わせ",
					href: "/contact",
				}}
			/>

			<Section>
				<SectionTitle title="業種別ソリューション" subtitle="各業界のニーズに応える専用システム" />

				<div className="space-y-12 md:space-y-16 mt-8 md:mt-12">
					{solutions.map((solution, index) => (
						<div
							key={solution.title}
							className={`flex flex-col ${
								index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
							} gap-6 md:gap-8 lg:gap-12 items-center`}
						>
							<div className="flex-1 space-y-3 md:space-y-4">
								<h3 className="text-xl md:text-2xl font-semibold">{solution.title}</h3>
								<p className="text-muted-foreground text-sm md:text-base">{solution.description}</p>
								<Button asChild className="mt-2 md:mt-4">
									<Link href={solution.href} className="flex items-center gap-2">
										詳細を見る
										<ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
									</Link>
								</Button>
							</div>
							<div className="flex-1 w-full max-w-[500px] mx-auto md:max-w-none">
								<div className="rounded-lg overflow-hidden border shadow-sm">
									<Image
										src={solution.imageSrc}
										alt={solution.title}
										width={600}
										height={400}
										className="w-full h-auto"
										sizes="(max-width: 768px) 100vw, 50vw"
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</Section>

			<Section className="bg-muted/30">
				<SectionTitle title="導入メリット" subtitle="業務のデジタル化がもたらす多くのメリット" />

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-12">
					{benefits.map((benefit) => {
						const IconComponent = benefit.icon;
						return (
							<div
								key={benefit.title}
								className="bg-background rounded-lg p-4 sm:p-6 shadow-sm border border-border/40"
							>
								<div className="flex gap-3 sm:gap-4 items-start">
									<div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
										<IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
									</div>
									<div>
										<h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
											{benefit.title}
										</h3>
										<p className="text-muted-foreground text-xs sm:text-sm">
											{benefit.description}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</Section>
		</>
	);
}
