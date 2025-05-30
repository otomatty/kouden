import type { Metadata } from "next";
import { BarChart2, Calculator, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { CTASection } from "../_components/CTASection";

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

	const scenarios = [
		{
			id: "trend-review",
			title: "支出傾向の確認",
			description: "過去データのグラフを見て香典支出の傾向を把握。",
			icon: BarChart2,
		},
		{
			id: "report-export",
			title: "レポート作成",
			description: "グラフをレポートに添付して共有できます。",
			icon: FileText,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle
					title="自動計算＆グラフ表示"
					subtitle="金額ミスを防ぎ、視覚的にデータを把握"
					className="mb-8"
				/>
				<p className="text-muted-foreground mb-6">
					面倒な計算は任せて、データの傾向をすぐにキャッチ。
				</p>
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

			<OtherFeaturesList currentFeatureId="auto-calc-graph" />

			<CTASection />
		</div>
	);
}
