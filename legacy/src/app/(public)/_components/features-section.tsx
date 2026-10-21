import { Cloud, BarChart2, FileText, Monitor, Gift, Lock, LayoutDashboard } from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

const features = [
	{
		id: "cloud-sync",
		Icon: Cloud,
		name: "クラウド同期",
		description: "クラウド上にデータを自動的に同期し、複数デバイスからいつでもアクセスできます。",
		href: "/features/cloud-sync",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "auto-calc-graph",
		Icon: BarChart2,
		name: "自動計算＆グラフ表示",
		description: "入力したデータを自動で計算し、グラフで視覚的に分析できます。",
		href: "/features/auto-calc-graph",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "export",
		Icon: FileText,
		name: "Excel/PDF出力",
		description: "計算結果をExcelやPDF形式で簡単に出力できます。",
		href: "/features/export",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "multi-device",
		Icon: Monitor,
		name: "あらゆる端末で使える",
		description: "デスクトップからモバイルまで、あらゆるデバイスをサポートします。",
		href: "/features/multi-device",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "return-management",
		Icon: Gift,
		name: "香典返し管理",
		description: "香典返しの管理を一元化し、スムーズに運用できます。",
		href: "/features/return-management",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "invite-security",
		Icon: Lock,
		name: "招待制セキュリティ",
		description: "招待制を導入し、セキュリティを強化できます。",
		href: "/features/invite-security",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
	{
		id: "dedicated-ui",
		Icon: LayoutDashboard,
		name: "使いやすいUI",
		description: "直感的で見やすいUIを提供します。",
		href: "/features/dedicated-ui",
		cta: "詳しく見る",
		className: "md:col-span-1",
		background: <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />,
	},
];

export function FeaturesSection() {
	return (
		<Section id="features" bgClassName="bg-background">
			<SectionTitle
				title="不安を解決するための機能"
				subtitle="初めての方でも安心して使える、シンプルで便利な機能"
				className="mb-16"
			/>
			<BentoGrid className="auto-rows-[20rem] md:auto-rows-[25rem]">
				{features.map((feature) => (
					<BentoCard key={feature.id} {...feature} />
				))}
			</BentoGrid>
		</Section>
	);
}
