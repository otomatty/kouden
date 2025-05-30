import type { Metadata } from "next";
import { Gift, List, Bell, FileText } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../_components/CTASection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

export const metadata: Metadata = {
	title: "香典返し管理 | 機能詳細 | 香典帳",
	description: "香典返し管理機能の詳細ページです。誰に何をいつ返したかを一括管理できます。",
};

export default function ReturnManagementPage() {
	const points = [
		{
			title: "一元管理",
			description: "返礼品の送り先と日時を一覧で管理できます。",
			icon: List,
		},
		{
			title: "リマインダー",
			description: "返礼品の準備時期を自動通知します。",
			icon: Bell,
		},
		{
			title: "履歴エクスポート",
			description: "返礼履歴をExcel/PDFに出力可能です。",
			icon: FileText,
		},
	];

	const scenarios = [
		{
			id: "manage-gifts",
			title: "返礼品準備",
			description: "返し忘れを防ぎ効率的に手配。",
			icon: Gift,
		},
		{
			id: "export-history",
			title: "履歴の出力",
			description: "返礼履歴をレポート形式でまとめて共有。",
			icon: FileText,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle title="香典返し管理" subtitle="返礼品の手配を一括管理" className="mb-8" />
				<p className="text-muted-foreground mb-6">
					誰に何をいつ返したか、すべての履歴を可視化します。
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

			<OtherFeaturesList currentFeatureId="return-management" />

			<CTASection />
		</div>
	);
}
