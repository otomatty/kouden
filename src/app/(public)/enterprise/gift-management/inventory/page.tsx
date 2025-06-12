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
	title: "在庫管理 | ギフトショップ向け管理システム",
	description:
		"ギフトショップ向け管理システムの在庫管理機能。商品の入荷から出荷まで、在庫状況をリアルタイムに把握できます。",
};

export default function InventoryPage() {
	const features = [
		{
			title: "リアルタイム在庫管理",
			description:
				"複数店舗やオンラインストアの在庫状況をリアルタイムで一元管理。在庫切れや過剰在庫を防止します。",
		},
		{
			title: "バーコード/QRコード対応",
			description:
				"バーコードやQRコードを活用した在庫管理システムに対応。入出荷作業の効率化と正確性向上を実現します。",
		},
		{
			title: "自動発注システム",
			description:
				"在庫が設定した閾値を下回ると自動的に発注アラートを生成。常に適切な在庫水準を維持できます。",
		},
		{
			title: "在庫分析レポート",
			description:
				"在庫回転率や滞留商品の分析など、詳細なレポートを自動生成。経営判断に役立つ情報を提供します。",
		},
		{
			title: "入出荷履歴管理",
			description:
				"すべての入出荷履歴を記録し、トレーサビリティを確保。商品のロット管理も可能です。",
		},
		{
			title: "棚卸し機能",
			description:
				"定期的な棚卸し作業をサポート。モバイルデバイスを使った実地棚卸しと自動照合ができます。",
		},
	];

	const screenshotDetails = {
		src: "/screenshots/gift-shop/inventory.png",
		alt: "在庫管理画面",
		caption: "在庫一覧と詳細情報の管理画面",
	};

	return (
		<>
			<DetailPageLayout
				title="在庫管理"
				subtitle="在庫状況をリアルタイムに把握し、効率的な商品管理を実現"
				contentTitle="スマートな在庫管理"
				contentSubtitle="機会損失と過剰在庫を防ぐ最適化システム"
				imagePosition="left"
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
