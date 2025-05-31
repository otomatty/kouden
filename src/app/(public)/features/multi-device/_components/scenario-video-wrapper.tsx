"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { Monitor, Smartphone, Users, CloudOff, Tablet } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "on-the-go",
		title: "外出先で簡単入力",
		description: "スマホから直接香典情報を記録。",
		icon: Smartphone,
		videoUrl: "/videos/multi-device/on-the-go.mp4",
	},
	{
		id: "home-edit",
		title: "自宅でPC編集",
		description: "大画面で快適に一括管理・出力。",
		icon: Monitor,
		videoUrl: "/videos/multi-device/home-edit.mp4",
	},
	{
		id: "collaborative-edit",
		title: "同時編集",
		description: "複数ユーザーでリアルタイムに共同編集。",
		icon: Users,
		videoUrl: "/videos/multi-device/collaborative-edit.mp4",
	},
	{
		id: "offline-support",
		title: "オフライン対応",
		description: "ネットワーク切断時もローカルで編集。",
		icon: CloudOff,
		videoUrl: "/videos/multi-device/offline-support.mp4",
	},
	{
		id: "tablet-optimization",
		title: "タブレット最適化",
		description: "タブレットでも使いやすいUIを提供。",
		icon: Tablet,
		videoUrl: "/videos/multi-device/tablet-optimization.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
