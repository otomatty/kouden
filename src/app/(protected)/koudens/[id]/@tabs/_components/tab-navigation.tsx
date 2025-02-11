"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Table2, Gift, Mail, BarChart3, Settings, Box } from "lucide-react";
import { useMemo } from "react";
import React from "react";

interface TabNavigationProps {
	id: string;
}

/**
 * 香典帳詳細画面のタブナビゲーションコンポーネント
 * - タブの切り替えとURLの同期を行う
 * - 選択中のタブはURLのパスで判定
 * - デスクトップ専用のナビゲーション
 * - パフォーマンス最適化：
 *   - React.memoを使用してコンポーネントの不要な再レンダリングを防止
 *   - useMemoを使用してタブ定義の再生成を防止
 */
export const TabNavigation = React.memo(function TabNavigation({ id }: TabNavigationProps) {
	const pathname = usePathname();

	const tabs = useMemo(
		() => [
			{ id: "entries", label: "ご香典", icon: <Table2 className="h-5 w-5" /> },
			{ id: "offerings", label: "お供物", icon: <Gift className="h-5 w-5" /> },
			{ id: "telegrams", label: "弔電", icon: <Mail className="h-4 w-4" /> },
			{ id: "return_records", label: "香典返し", icon: <Box className="h-4 w-4" /> },
			{ id: "statistics", label: "統計", icon: <BarChart3 className="h-4 w-4" /> },
			{ id: "settings", label: "設定", icon: <Settings className="h-4 w-4" /> },
		],
		[],
	);

	return (
		<div className="flex space-x-4 border-b">
			{tabs.map((tab) => {
				const isActive = pathname.includes(`/${tab.id}`);
				return (
					<Link
						key={tab.id}
						href={`/koudens/${id}/${tab.id}`}
						className={cn(
							"flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
							isActive
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.icon}
						<span>{tab.label}</span>
					</Link>
				);
			})}
		</div>
	);
});
