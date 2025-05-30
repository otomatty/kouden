import type { Metadata } from "next";
import { Monitor, Smartphone, Users, CloudOff } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { ScenarioCard } from "../_components/ScenarioCard";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../_components/CTASection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

export const metadata: Metadata = {
	title: "マルチデバイス対応 | 機能詳細 | 香典帳",
	description: "マルチデバイス対応機能の詳細ページです。スマホ・PCで共同編集が可能です。",
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

	const scenarios = [
		{
			id: "on-the-go",
			title: "外出先で簡単入力",
			description: "スマホから直接香典情報を記録。",
			icon: Smartphone,
		},
		{
			id: "home-edit",
			title: "自宅でPC編集",
			description: "大画面で快適に一括管理・出力。",
			icon: Monitor,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container">
				<SectionTitle
					title="マルチデバイス対応"
					subtitle="スマホ・PCでいつでも編集"
					className="mb-8"
				/>
				<p className="text-muted-foreground mb-6">好きなデバイスで自由に編集・共有が可能です。</p>
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

			<OtherFeaturesList currentFeatureId="multi-device" />

			<CTASection />
		</div>
	);
}
