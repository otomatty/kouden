import { Monitor, Users, Gift, BarChart2, BookOpen, ShieldCheck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";

/**
 * 主要な機能を表示するセクション
 */
export function FeaturesSection() {
	const features = [
		{
			title: "香典情報のデジタル管理",
			description: "いただいた香典の金額や贈り主の情報をデジタルで簡単に記録・管理できます。",
			icon: Monitor,
		},
		{
			title: "家族・親族との情報共有",
			description:
				"複数の家族や親族で同じ香典帳データを共有し、リアルタイムで更新・確認が可能です。",
			icon: Users,
		},
		{
			title: "返礼品の管理と予算計算",
			description: "適切な返礼品の選定や予算計算をサポートし、お返しの準備を効率化します。",
			icon: Gift,
		},
		{
			title: "自動集計と分析",
			description: "総額や平均金額などを自動計算。グラフや集計データで全体像を把握できます。",
			icon: BarChart2,
		},
		{
			title: "住所録と連携",
			description:
				"返礼状送付のための住所録としても活用可能。CSVデータのインポート/エクスポートにも対応。",
			icon: BookOpen,
		},
		{
			title: "安心のデータ保護",
			description:
				"クラウド保存でデータ紛失を防止。厳格なセキュリティ対策でプライバシーを保護します。",
			icon: ShieldCheck,
		},
	];

	return (
		<Section className="bg-muted/30">
			<SectionTitle title="主な機能" subtitle="香典帳アプリの便利な機能をご紹介します" />

			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12">
				{features.map(({ title, description, icon: IconComponent }) => (
					<div
						key={title}
						className="bg-background rounded-lg p-4 sm:p-6 shadow-sm border border-border/40 hover:shadow-md transition-shadow"
					>
						<div className="flex gap-3 sm:gap-4 items-start">
							<div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
								<IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
							</div>
							<div>
								<h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{title}</h3>
								<p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}
