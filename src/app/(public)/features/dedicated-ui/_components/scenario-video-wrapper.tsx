"use client";

import type React from "react";
import { ScenarioVideoSection, type Scenario } from "../../_components/ScenarioVideoSection";
import { LayoutDashboard, SlidersHorizontal, Moon, Sun, Smartphone } from "lucide-react";

const scenarios: Scenario[] = [
	{
		id: "simple-operation",
		title: "迷わない操作",
		description: "誰でもすぐに使い始められるデザイン。",
		icon: LayoutDashboard,
		videoUrl: "/videos/dedicated-ui/simple-operation.mp4",
	},
	{
		id: "theme-switch",
		title: "テーマ切替",
		description: "好みに合わせてライト/ダークを切り替え。",
		icon: Sun,
		videoUrl: "/videos/dedicated-ui/theme-switch.mp4",
	},
	{
		id: "custom-layout",
		title: "カスタムレイアウト",
		description: "表示項目を自由に設定。",
		icon: SlidersHorizontal,
		videoUrl: "/videos/dedicated-ui/custom-layout.mp4",
	},
	{
		id: "dark-mode",
		title: "ダークモード",
		description: "目に優しいダークテーマに切り替え可能。",
		icon: Moon,
		videoUrl: "/videos/dedicated-ui/dark-mode.mp4",
	},
	{
		id: "responsive-design",
		title: "レスポンシブデザイン",
		description: "あらゆる画面サイズに最適化。",
		icon: Smartphone,
		videoUrl: "/videos/dedicated-ui/responsive-design.mp4",
	},
];

export default function ScenarioVideoWrapper() {
	return <ScenarioVideoSection scenarios={scenarios} />;
}
