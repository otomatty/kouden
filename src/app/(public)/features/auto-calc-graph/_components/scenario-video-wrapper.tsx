"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { BarChart2, FileText, CheckCircle, Filter, BarChart } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "trend-review",
		title: "支出傾向の確認",
		description: "過去データのグラフを見て香典支出の傾向を把握。",
		icon: BarChart2,
		videoUrl: "/videos/auto-calc-graph/trend-review.mp4",
	},
	{
		id: "report-export",
		title: "レポート作成",
		description: "グラフをレポートに添付して共有できます。",
		icon: FileText,
		videoUrl: "/videos/auto-calc-graph/report-export.mp4",
	},
	{
		id: "duplicate-check",
		title: "重複チェック",
		description: "似たようなデータを自動で検出して通知します。",
		icon: CheckCircle,
		videoUrl: "/videos/auto-calc-graph/duplicate-check.mp4",
	},
	{
		id: "category-filter",
		title: "カテゴリフィルタリング",
		description: "葬儀／返礼などカテゴリ別にグラフを表示できます。",
		icon: Filter,
		videoUrl: "/videos/auto-calc-graph/category-filter.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
