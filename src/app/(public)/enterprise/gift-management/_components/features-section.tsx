import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Users, Gift, Mail, ShoppingCart, Package, Database, BarChart2 } from "lucide-react";

/**
 * ギフトショップ向けの主な機能を表示するセクション
 */
export function FeaturesSection() {
	const features = [
		{
			id: "profiles",
			icon: Users,
			title: "顧客プロファイル管理",
			description: "名前・連絡先・誕生日・購入履歴・セグメンテーションを一元管理。",
		},
		{
			id: "loyalty",
			icon: Gift,
			title: "ロイヤルティ・プログラム",
			description: "ポイント管理、会員ランク、バースデー特典などで顧客をエンゲージ。",
		},
		{
			id: "marketing",
			icon: Mail,
			title: "CRM／マーケティング自動化",
			description: "メール/SMSキャンペーン管理とパーソナライズドレコメンデーション。",
		},
		{
			id: "store-integration",
			icon: ShoppingCart,
			title: "オンラインストア連携",
			description: "商品カタログ同期、カート／決済、ウィッシュリスト対応。",
		},
		{
			id: "orders",
			icon: Package,
			title: "注文＆配送管理",
			description: "注文ステータス追跡、配送通知、業者API連携。",
		},
		{
			id: "inventory",
			icon: Database,
			title: "在庫＆POS連携",
			description: "リアルタイム在庫把握、自動再発注、オフラインPOS対応。",
		},
		{
			id: "reports",
			icon: BarChart2,
			title: "レポート＆分析",
			description: "顧客LTVや売れ筋商品分析をダッシュボードで可視化。",
		},
	];

	return (
		<Section id="features" className="py-24">
			<SectionTitle
				title="主な機能"
				subtitle="ギフトショップ運営を強力にサポートする機能一覧"
				className="mb-12"
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<div
							key={feature.id}
							className="flex flex-col items-start p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
						>
							<Icon className="h-8 w-8 text-primary mb-4" />
							<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground">{feature.description}</p>
						</div>
					);
				})}
			</div>
		</Section>
	);
}
