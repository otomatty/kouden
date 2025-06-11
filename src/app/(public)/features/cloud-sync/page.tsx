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
import { Section } from "@/components/ui/section";
import { MediaSection } from "../_components/MediaSection";

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
		<div className="space-y-8">
			<PageHero
				title="クラウド同期"
				subtitle="いつでもどこでも最新の香典帳を手元に"
				className="bg-background"
			/>
			<MediaSection />

			<Section>
				<SectionTitle title="特徴" className="mb-8" />
				<div className="grid md:grid-cols-3 gap-4">
					{points.map((p) => (
						<FeaturePointCard key={p.title} {...p} />
					))}
				</div>
			</Section>

			<Section>
				<SectionTitle title="利用シーン" className="mb-8" />
				<ScenarioVideoWrapper />
			</Section>

			<TestimonialsSection testimonials={testimonials} />

			<OtherFeaturesList currentFeatureId="cloud-sync" />

			<CTASection />
		</div>
	);
}
