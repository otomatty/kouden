import Link from "next/link";
import { SectionTitle } from "@/components/ui/section-title";
import {
	Cloud,
	BarChart2,
	FileText,
	Monitor,
	Gift,
	Lock,
	LayoutDashboard,
	Timer,
} from "lucide-react";
import type React from "react";

type FeatureItem = {
	id: string;
	title: string;
	description: string;
};

const featuresList: FeatureItem[] = [
	{ id: "cloud-sync", title: "クラウド同期", description: "出先でも最新データを確認・共有できる" },
	{
		id: "auto-calc-graph",
		title: "自動計算＆グラフ表示",
		description: "金額ミスを防ぎ、視覚的にデータを把握",
	},
	{ id: "export", title: "Excel/PDF出力", description: "帳簿をエクセルやPDFで即エクスポート" },
	{ id: "multi-device", title: "マルチデバイス対応", description: "スマホ・PCで共同編集が可能" },
	{ id: "return-management", title: "香典返し管理", description: "返礼品の情報も一緒に一括管理" },
	{
		id: "invite-security",
		title: "招待制セキュリティ",
		description: "招待制で安心のプライバシー保護",
	},
	{
		id: "dedicated-ui",
		title: "使いやすいUI",
		description: "シンプルで直感的な専用ダッシュボード",
	},
];

// Map feature IDs to icons
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	"cloud-sync": Cloud,
	"auto-calc-graph": BarChart2,
	export: FileText,
	"multi-device": Monitor,
	"return-management": Gift,
	"invite-security": Lock,
	"dedicated-ui": LayoutDashboard,
};

export function OtherFeaturesList({ currentFeatureId }: { currentFeatureId: string }) {
	const others = featuresList.filter((f) => f.id !== currentFeatureId);
	return (
		<section className="py-16 container">
			<SectionTitle title="他の機能も見る" className="mb-8" />
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{others.map((f) => {
					const Icon = iconMap[f.id];
					if (!Icon) {
						return null;
					}
					return (
						<Link
							key={f.id}
							href={`/features/${f.id}`}
							className="flex-none h-80 flex flex-col items-center justify-end p-4 space-y-2 rounded-lg border bg-card hover:bg-accent transition-colors"
						>
							<div className="flex gap-2 justify-start w-full">
								<Icon className="h-6 w-6 text-primary" />
								<span className="text-lg font-semibold text-start">{f.title}</span>
							</div>
							<p className="text-sm text-muted-foreground text-start w-full">{f.description}</p>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
