import type React from "react";
import { Users, Box, TrendingUp } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { Section } from "@/components/ui/section";

interface Program {
	title: string;
	target: string;
	value: string;
	details: string[];
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const programs: Program[] = [
	{
		title: "サポートパートナー",
		target: "葬儀社様・寺院様",
		value: "香典管理を自動化し、手間を大幅削減。",
		details: [
			"QRコードスキャンで香典情報を自動登録",
			"月次レポートをPDFで自動生成・配布",
			"24時間以内のトラブル対応と操作サポート",
		],
		icon: Users,
	},
	{
		title: "ECパートナー",
		target: "ギフトショップ様",
		value: "システム連携で受注・在庫管理を",
		details: [
			"受注・在庫データを顧客管理システムと自動同期",
			"在庫閾値割れ時にSlack通知を自動送信",
			"注文データ分析によるレコメンド機能開発",
		],
		icon: Box,
	},
	{
		title: "ビジネスパートナー",
		target: "新規事業を模索する企業様",
		value: "市場拡大と新サービス開発を共に推進。",
		details: [
			"新サービス企画の共同ワークショップ開催",
			"四半期ごとの市場分析レポート提供",
			"契約交渉・法務サポートの提供",
		],
		icon: TrendingUp,
	},
];

/**
 * 貴社のビジネスを成長させるパートナーシップセクション
 */
export function PartnerPrograms() {
	return (
		<Section id="partner-programs">
			<SectionTitle
				title="3つのパートナーシップ"
				subtitle="企業向けサービス概要"
				className="mb-12"
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{programs.map((p) => (
					<div
						key={p.title}
						className="relative p-8 bg-white rounded-lg shadow-sm hover:shadow-lg transition border border-border"
					>
						<span className="absolute z-10 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-primary border border-border rounded-full p-2 text-center">
							{p.target}
						</span>
						<p.icon className="absolute bottom-4 right-4 h-32 w-32 text-secondary opacity-10" />
						<div className="relative z-10 flex flex-col items-center text-center">
							<h3 className="text-2xl md:text-3xl font-bold mb-2">{p.title}</h3>
							<p className="text-lg md:text-xl font-semibold mb-4">{p.value}</p>
							<ul className="list-disc list-inside text-gray-600 space-y-2 self-start text-left">
								{p.details.map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}
