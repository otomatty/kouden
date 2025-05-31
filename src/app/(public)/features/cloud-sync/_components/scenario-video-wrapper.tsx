"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { MapPin, Home, CloudOff, RefreshCw, History } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "venue-check",
		title: "葬儀会場での確認",
		description: "外出先の葬儀会場でスマホからすぐ金額を確認。",
		icon: MapPin,
		videoUrl: "/videos/cloud-sync/venue-check.mp4",
	},
	{
		id: "home-sync",
		title: "帰宅後の家族共有",
		description: "帰宅後すぐに家族とデータを共有・更新。",
		icon: Home,
		videoUrl: "/videos/cloud-sync/home-sync.mp4",
	},
	{
		id: "offline-access",
		title: "オフラインアクセス",
		description: "ネットワーク切断時もローカルキャッシュで閲覧・編集可能。",
		icon: CloudOff,
		videoUrl: "/videos/cloud-sync/offline-access.mp4",
	},
	{
		id: "background-sync",
		title: "バックグラウンド同期",
		description: "アプリを閉じても、接続復帰で自動的にデータが同期される。",
		icon: RefreshCw,
		videoUrl: "/videos/cloud-sync/background-sync.mp4",
	},
	{
		id: "version-history",
		title: "バージョン履歴",
		description: "過去の同期データを一覧し、任意の時点へロールバックできる機能。",
		icon: History,
		videoUrl: "/videos/cloud-sync/version-history.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
