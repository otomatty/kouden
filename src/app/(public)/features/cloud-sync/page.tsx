import type { Metadata } from "next";
import { Cloud, Users, Shield } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { CTASection } from "../../_components/cta-section";
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

	return (
		<div className="space-y-24">
			<PageHero
				title="クラウド同期"
				subtitle="いつでもどこでも最新の香典帳を手元に"
				className="bg-background"
			/>
			<section className="py-16 container mx-auto">
				<div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
					{/* デモ動画またはスクリーンショット */}
					動画/スクリーンショット
				</div>
			</section>

			<section className="container mx-auto">
				<SectionTitle title="特徴" className="mb-8" />
				<div className="grid md:grid-cols-3 gap-8">
					{points.map((p) => (
						<FeaturePointCard key={p.title} {...p} />
					))}
				</div>
			</section>

			<section className="container mx-auto">
				<SectionTitle title="利用シーン" className="mb-8" />
				<ScenarioVideoWrapper />
			</section>

			<TestimonialsSection testimonials={testimonials} />

			<OtherFeaturesList currentFeatureId="cloud-sync" />

			<CTASection />
		</div>
	);
}
