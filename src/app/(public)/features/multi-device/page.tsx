import type { Metadata } from "next";
import { Smartphone, Users, CloudOff } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../../_components/cta-section";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

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
		<div className="space-y-24">
			<section className="py-16 container mx-auto">
				<PageHero
					title="マルチデバイス対応"
					subtitle="スマホ・PCでいつでも編集"
					className="bg-background"
				/>
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

			<OtherFeaturesList currentFeatureId="multi-device" />

			<CTASection />
		</div>
	);
}
