import type { Metadata } from "next";
import { FileSpreadsheet, FileText, SlidersHorizontal } from "lucide-react";
import { PageHero } from "../../_components/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { FeaturePointCard } from "../_components/FeaturePointCard";
import ScenarioVideoWrapper from "./_components/scenario-video-wrapper";
import { TestimonialsSection } from "../_components/TestimonialsSection";
import { testimonials } from "./testimonials";
import { CTASection } from "../../_components/cta-section";
import { OtherFeaturesList } from "../_components/OtherFeaturesList";

export const metadata: Metadata = {
	title: "Excel/PDF出力 | 機能詳細 | 香典帳",
	description: "ExcelおよびPDF出力機能の詳細ページです。香典帳を簡単にダウンロードできます。",
};

export default function ExportPage() {
	const points = [
		{
			title: "Excel出力",
			description: "香典帳をExcel形式でダウンロード可能です。",
			icon: FileSpreadsheet,
		},
		{
			title: "PDF出力",
			description: "報告書形式のPDFをワンクリックで生成します。",
			icon: FileText,
		},
		{
			title: "カスタムテンプレート",
			description: "出力フォーマットをカスタマイズできます。",
			icon: SlidersHorizontal,
		},
	];

	return (
		<div className="space-y-24">
			<section className="py-16 container mx-auto">
				<PageHero
					title="Excel/PDF出力"
					subtitle="香典帳を簡単にダウンロード"
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

			<OtherFeaturesList currentFeatureId="export" />

			<CTASection />
		</div>
	);
}
