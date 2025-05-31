"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { Gift, FileText, Bell, List, Calendar } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "manage-gifts",
		title: "返礼品準備",
		description: "返し忘れを防ぎ効率的に手配。",
		icon: Gift,
		videoUrl: "/videos/return-management/manage-gifts.mp4",
	},
	{
		id: "export-history",
		title: "履歴エクスポート",
		description: "返礼履歴をレポート形式でまとめて共有。",
		icon: FileText,
		videoUrl: "/videos/return-management/export-history.mp4",
	},
	{
		id: "reminder-notifications",
		title: "リマインダー通知",
		description: "返礼品準備時期を自動通知。",
		icon: Bell,
		videoUrl: "/videos/return-management/reminder-notifications.mp4",
	},
	{
		id: "list-view",
		title: "一覧表示",
		description: "全返礼品を一覧で確認。",
		icon: List,
		videoUrl: "/videos/return-management/list-view.mp4",
	},
	{
		id: "schedule-export",
		title: "定期出力",
		description: "スケジュールに沿って履歴を定期出力。",
		icon: Calendar,
		videoUrl: "/videos/return-management/schedule-export.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
