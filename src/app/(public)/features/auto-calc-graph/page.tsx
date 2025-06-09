import type { Metadata } from "next";
import { Calculator, TrendingUp, AlertCircle } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { CTASection } from "../../_components/cta-section";

export const metadata: Metadata = {
	title: "自動計算＆グラフ表示 | 機能詳細 | 香典帳",
	description:
		"自動計算とグラフ表示機能の詳細ページです。金額ミスを防ぎ、視覚的にデータを把握できます。",
};

export default function AutoCalcGraphPage() {
	const points = [
		{
			title: "自動合計計算",
			description: "入力時に合計金額をリアルタイムに計算します。",
			icon: Calculator,
		},
		{
			title: "傾向分析",
			description: "時系列グラフで支出傾向を簡単に把握できます。",
			icon: TrendingUp,
		},
		{
			title: "ミス防止",
			description: "グラフ表示で異常値を視覚的に検出します。",
			icon: AlertCircle,
		},
	];

	return (
		<div className="space-y-24">
			<PageHero
				title="自動計算＆グラフ表示"
				subtitle="金額ミスを防ぎ、視覚的にデータを把握"
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

			<OtherFeaturesList currentFeatureId="auto-calc-graph" />

			<CTASection />
		</div>
	);
}
