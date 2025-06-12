import { Section } from "@/components/ui/section";
import { SectionTitle } from "@/components/ui/section-title";
import { Users, FileText, Box, CheckSquare, BarChart2, RefreshCw, Smartphone } from "lucide-react";

/**
 * 葬儀会社向けの主な機能を表示するセクション
 */
export function FeaturesSection() {
	const features = [
		{
			id: "crm",
			icon: Users,
			title: "顧客管理(CRM)",
			description:
				"問い合わせから契約、施行後フォローまで一元的に管理。顧客属性やコミュニケーション履歴も記録。",
		},
		{
			id: "quotes",
			icon: FileText,
			title: "見積・請求管理",
			description: "見積書の作成・PDF出力、請求書・領収書の発行とステータス管理をスムーズに。",
		},
		{
			id: "inventory",
			icon: Box,
			title: "資材受発注・在庫管理",
			description: "祭壇資材や返礼品の発注状況をトラッキングし、在庫残高をリアルタイムに把握。",
		},
		{
			id: "workflow",
			icon: CheckSquare,
			title: "ワークフロー・タスク管理",
			description: "施行スケジュール管理、スタッフアサイン、リマインドやアンケート機能を搭載。",
		},
		{
			id: "analytics",
			icon: BarChart2,
			title: "分析・レポート",
			description: "施行件数や売上推移、顧客満足度などのKPIをダッシュボードで可視化。",
		},
		{
			id: "realtime",
			icon: RefreshCw,
			title: "リアルタイム情報共有",
			description: "クラウド更新により全拠点に即時データ反映。チーム全体で最新情報を共有。",
		},
		{
			id: "mobile",
			icon: Smartphone,
			title: "モバイル＆オンライン予約",
			description: "スマホ対応UIとオンライン火葬予約受付機能で、どこからでも予約管理が可能。",
		},
	];

	return (
		<Section id="features" className="py-24">
			<SectionTitle
				title="主な機能"
				subtitle="葬儀業務を効率化する豊富な機能一覧"
				className="mb-12"
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<div
							key={feature.id}
							className="flex flex-col items-start p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
						>
							<Icon className="h-8 w-8 text-primary mb-4" />
							<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground">{feature.description}</p>
						</div>
					);
				})}
			</div>
		</Section>
	);
}
