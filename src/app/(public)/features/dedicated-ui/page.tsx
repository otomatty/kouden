import type { Metadata } from "next";
import { LayoutDashboard, SlidersHorizontal, Moon } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";
import { MediaSection } from "../_components/MediaSection";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../../_components/cta-section";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

export const metadata: Metadata = {
	title: "使いやすいUI | 機能詳細 | 香典帳",
	description: "使いやすいUI機能の詳細ページです。直感的な操作性を提供します。",
};

export default function DedicatedUIPage() {
	const points = [
		{
			title: "シンプルレイアウト",
			description: "直感的なUIで迷わず操作できます。",
			icon: LayoutDashboard,
		},
		{
			title: "カスタマイズ可能",
			description: "表示項目を自由に設定できます。",
			icon: SlidersHorizontal,
		},
		{
			title: "ダークモード対応",
			description: "目に優しいダークテーマに切り替え可能。",
			icon: Moon,
		},
	];

	return (
		<div className="space-y-8">
			<PageHero
				title="使いやすいUI"
				subtitle="迷わず直感的に操作できるデザイン"
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

			<OtherFeaturesList currentFeatureId="dedicated-ui" />

			<CTASection />
		</div>
	);
}
