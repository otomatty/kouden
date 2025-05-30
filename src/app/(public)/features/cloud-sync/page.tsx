import type { Metadata } from "next";
import { Cloud, Users, Shield, MapPin, Home } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { CTASection } from "../_components/CTASection";
import { testimonials } from "./testimonials";

export const metadata: Metadata = {
	title: "クラウド同期 | 機能詳細 | 香典帳",
	description: "クラウド同期機能の詳細ページです。出先でも最新の香典情報をいつでも確認できます。",
};

export default function CloudSyncPage() {
	const points = [
		{
			title: "外出先で即確認",
			description: "スマホからいつでも最新の香典情報を確認できます。",
			icon: Cloud,
		},
		{
			title: "家族とリアルタイム共有",
			description: "家族間でデータを即時同期し、常に最新の状態を保ちます。",
			icon: Users,
		},
		{
			title: "データ消失防止",
			description: "クラウド保存で大切なデータを安全に保護します。",
			icon: Shield,
		},
	];

	const scenarios = [
		{
			id: "venue-check",
			title: "葬儀会場での確認",
			description: "外出先の葬儀会場でスマホからすぐ金額を確認。",
			icon: MapPin,
		},
		{
			id: "home-sync",
			title: "帰宅後の家族共有",
			description: "帰宅後すぐに家族とデータを共有・更新。",
			icon: Home,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle
					title="クラウド同期"
					subtitle="いつでもどこでも最新の香典帳を手元に"
					className="mb-8"
				/>
				<p className="text-muted-foreground mb-6">手書き帳簿を探し回る手間はもう不要です。</p>
				<div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
					{/* デモ動画またはスクリーンショット */}
					動画/スクリーンショット
				</div>
			</section>

			<section className="container">
				<SectionTitle title="特徴" className="mb-8" />
				<div className="grid md:grid-cols-3 gap-8">
					{points.map((p) => (
						<FeaturePointCard key={p.title} {...p} />
					))}
				</div>
			</section>

			<section className="container">
				<SectionTitle title="利用シーン" className="mb-8" />
				<div className="space-y-6">
					{scenarios.map((s) => (
						<ScenarioCard key={s.id} {...s} />
					))}
				</div>
			</section>

			<TestimonialsSection testimonials={testimonials} />

			<OtherFeaturesList currentFeatureId="cloud-sync" />

			<CTASection />
		</div>
	);
}
