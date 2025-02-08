"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Table2, Gift, Mail, BarChart3, Settings } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMemo } from "react";
import React from "react";

interface TabNavigationProps {
	id: string;
}

/**
 * 香典帳詳細画面のタブナビゲーションコンポーネント
 * - タブの切り替えとURLの同期を行う
 * - 選択中のタブはURLのパスで判定
 * - レスポンシブ対応：
 *   - モバイル時は選択されていないタブのテキストを非表示
 *   - モバイル時はアクティブでない項目を均等幅で配置
 * - パフォーマンス最適化：
 *   - React.memoを使用してコンポーネントの不要な再レンダリングを防止
 *   - useMemoを使用してタブ定義の再生成を防止
 */
export const TabNavigation = React.memo(function TabNavigation({ id }: TabNavigationProps) {
	const pathname = usePathname();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const tabs = useMemo(
		() => [
			{ id: "entries", label: "ご香典", icon: <Table2 className="h-5 w-5" /> },
			{ id: "offerings", label: "お供物", icon: <Gift className="h-5 w-5" /> },
			{ id: "telegrams", label: "弔電", icon: <Mail className="h-4 w-4" /> },
			{ id: "statistics", label: "統計", icon: <BarChart3 className="h-4 w-4" /> },
			{ id: "settings", label: "設定", icon: <Settings className="h-4 w-4" /> },
		],
		[],
	);

	return (
		<div className="flex sm:space-x-4 border-b">
			{tabs.map((tab) => {
				const isActive = pathname.includes(`/${tab.id}`);
				return (
					<Link
						key={tab.id}
						href={`/koudens/${id}/${tab.id}`}
						className={cn(
							"flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
							"sm:px-4 sm:justify-start",
							isActive ? "border-b-2 border-primary text-primary px-4" : "flex-1 sm:flex-none",
						)}
					>
						{tab.icon}
						<span className={isDesktop || isActive ? "inline" : "hidden"}>{tab.label}</span>
					</Link>
				);
			})}
		</div>
	);
});
