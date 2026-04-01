import { CloudOff, Smartphone, Users } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { CTASection } from "../../_components/cta-section";
import { PageHero } from "../../_components/page-hero";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { MediaSection } from "../_components/MediaSection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { testimonials } from "./testimonials";

export const metadata: Metadata = {
	title: "あらゆる端末で使える | 機能詳細 | 香典帳",
	description:
		"あらゆる端末で使える機能の詳細ページです。スマホ・PC・タブレットで共同編集が可能です。",
};

export default function MultiDevicePage() {
	const points = [
		{
			title: "どこでも編集",
			description: "スマホでもPCでも直感的に編集可能です。",
			icon: Smartphone,
		},
		{
			title: "同時編集",
			description: "複数ユーザーで同時にデータ入力ができます。",
			icon: Users,
		},
		{
			title: "オフライン対応",
			description: "ネットワーク切断時もローカルに保存します。",
			icon: CloudOff,
		},
	];

	return (
		<div className="space-y-8">
			<PageHero
				title="マルチデバイス対応"
				subtitle="スマホ・PCでいつでも編集"
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

			<OtherFeaturesList currentFeatureId="multi-device" />

			<CTASection />
		</div>
	);
}
