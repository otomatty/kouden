import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Bell, FileText, List } from "lucide-react";
import type { Metadata } from "next";
import { CTASection } from "../../_components/cta-section";
import { PageHero } from "../../_components/page-hero";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import { MediaSection } from "../_components/MediaSection";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { testimonials } from "./testimonials";

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

	return (
		<div className="space-y-8">
			<PageHero title="香典返し管理" subtitle="返礼品の手配を一括管理" className="bg-background" />
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

			<OtherFeaturesList currentFeatureId="return-management" />

			<CTASection />
		</div>
	);
}
