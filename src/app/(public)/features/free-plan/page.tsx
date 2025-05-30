import type { Metadata } from "next";
import { Tag, Download, CreditCard } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../_components/CTASection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

export const metadata: Metadata = {
	title: "基本利用無料 | 機能詳細 | 香典帳",
	description: "基本利用無料プランの詳細ページです。作成日から2週間は無料で利用可能です。",
};

export default function FreePlanPage() {
	const points = [
		{
			title: "無料プラン",
			description: "作成日から2週間はすべての機能を無料で利用可能。",
			icon: Tag,
		},
		{
			title: "エクスポート必須",
			description: "2週間後はExcel/PDF出力して保存。",
			icon: Download,
		},
		{
			title: "有料プランへの移行",
			description: "期間後は継続利用プランへ簡単にアップグレード。",
			icon: CreditCard,
		},
	];

	const scenarios = [
		{
			id: "trial-use",
			title: "お試し利用",
			description: "まずは無料で全機能を体験できます。",
			icon: Tag,
		},
		{
			id: "export-before-end",
			title: "期間終了前のエクスポート",
			description: "大切なデータを失わないようにエクスポート。",
			icon: Download,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle title="基本利用無料" subtitle="2週間無料トライアル" className="mb-8" />
				<p className="text-muted-foreground mb-6">まずは全機能を無料でお試しください。</p>
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

			<OtherFeaturesList currentFeatureId="free-plan" />

			<CTASection />
		</div>
	);
}
