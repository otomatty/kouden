import type { Metadata } from "next";
import { LayoutDashboard, SlidersHorizontal, Moon, Sun } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../_components/CTASection";
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

	const scenarios = [
		{
			id: "simple-operation",
			title: "迷わない操作",
			description: "誰でもすぐに使い始められるデザイン。",
			icon: LayoutDashboard,
		},
		{
			id: "theme-switch",
			title: "テーマ切替",
			description: "好みに合わせてライト/ダークを切り替え。",
			icon: Sun,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle
					title="使いやすいUI"
					subtitle="迷わず直感的に操作できるデザイン"
					className="mb-8"
				/>
				<p className="text-muted-foreground mb-6">
					細部にまでこだわったUIで、誰でも簡単に使えます。
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

			<OtherFeaturesList currentFeatureId="dedicated-ui" />

			<CTASection />
		</div>
	);
}
