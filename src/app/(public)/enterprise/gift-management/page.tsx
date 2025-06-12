import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";

export const metadata: Metadata = {
	title: "ギフトショップ向け管理システム | 香典帳",
	description:
		"ギフトショップ向けの総合管理システム。顧客管理から在庫、注文、ロイヤルティプログラムまで一元管理できます。",
};

export default function GiftShopPage() {
	const features = [
		{
			title: "顧客管理",
			description: "顧客情報を一元管理し、購買履歴や好みの分析もできます。",
			href: "/enterprise/gift-shop/customers",
		},
		{
			title: "在庫管理",
			description: "商品の在庫状況をリアルタイムで把握し、適切な在庫水準を維持します。",
			href: "/enterprise/gift-shop/inventory",
		},
		{
			title: "注文管理",
			description: "オムニチャネルの注文を一元管理し、配送状況も追跡できます。",
			href: "/enterprise/gift-shop/orders",
		},
		{
			title: "ロイヤルティ管理",
			description: "ポイントプログラムや会員ランク特典を設定し、リピーターを増やします。",
			href: "/enterprise/gift-shop/loyalty",
		},
		{
			title: "マーケティング管理",
			description: "効果的なキャンペーンの計画から実行、効果測定までを一元管理します。",
			href: "/enterprise/gift-shop/marketing",
		},
	];

	return (
		<>
			<PageHero
				title="ギフトショップ向け管理システム"
				subtitle="商品管理から顧客管理、販売管理まで一元管理できるクラウドシステム"
				cta={{
					label: "無料デモを申し込む",
					href: "/contact",
					icon: ChevronRight,
				}}
				className="bg-gradient-to-br from-gray-50 to-gray-100"
			/>

			<Section>
				<SectionTitle
					title="ギフトショップ業務をトータルサポート"
					subtitle="あらゆる業務プロセスを効率化し、売上アップをお手伝いします"
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
