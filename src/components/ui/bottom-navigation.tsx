"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Table2, Box, BarChart3, MoreHorizontal, Gift, Mail, Settings, Plus } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
	id: string;
}

/**
 * モバイル用のボトムナビゲーションコンポーネント
 * - 香典帳詳細画面のナビゲーションを提供
 * - モバイル時のみ表示される
 * - 主要な4つの項目（ご香典、香典返し、統計、その他）を表示
 * - 中央に新規作成ボタンを配置
 * - その他タブはドロップアップメニューで追加の項目を表示
 * - 現在のパスに基づいてアクティブな項目を強調表示
 */
export function BottomNavigation({ id }: BottomNavigationProps) {
	const pathname = usePathname();

	const leftTabs = [
		{ id: "entries", label: "ご香典", icon: <Table2 className="h-5 w-5" /> },
		{ id: "return_records", label: "香典返し", icon: <Box className="h-5 w-5" /> },
	];

	const rightTabs = [{ id: "statistics", label: "統計", icon: <BarChart3 className="h-5 w-5" /> }];

	const moreTabs = [
		{ id: "offerings", label: "お供物", icon: <Gift className="h-5 w-5" /> },
		{ id: "telegrams", label: "弔電", icon: <Mail className="h-5 w-5" /> },
		{ id: "settings", label: "設定", icon: <Settings className="h-5 w-5" /> },
	];

	// その他タブに含める項目のパス
	const morePaths = moreTabs.map((tab) => tab.id);

	const NavLink = ({ tab }: { tab: (typeof leftTabs)[0] }) => {
		const isActive = pathname.includes(`/${tab.id}`);
		return (
			<Link
				href={`/koudens/${id}/${tab.id}`}
				className={cn(
					"flex flex-col items-center justify-center gap-1 py-2",
					isActive ? "text-primary" : "text-muted-foreground",
				)}
			>
				{tab.icon}
				<span className="text-xs">{tab.label}</span>
			</Link>
		);
	};

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background md:hidden">
			<div className="flex h-16 items-center">
				{/* 左側のタブ */}
				<div className="flex flex-1 items-center justify-evenly">
					{leftTabs.map((tab) => (
						<NavLink key={tab.id} tab={tab} />
					))}
				</div>

				{/* 中央の新規作成ボタン */}
				<div className="relative flex h-full w-20 items-center justify-center ">
					{/* 下部の半円くり抜き */}
					<div className="absolute top-0 left-1/2 h-12 w-full overflow-hidden -translate-x-1/2">
						<div className="absolute bottom-0 h-20 w-full rounded-full bg-muted " />
					</div>
					{/* 新規作成ボタン */}
					<div className="absolute -top-6">
						<Button
							className="flex h-16 w-16 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90 [&_svg]:!h-6 [&_svg]:!w-6"
							onClick={() => {
								// TODO: 新規作成のハンドラーを実装
								console.log("新規作成");
							}}
						>
							<Plus />
						</Button>
					</div>
				</div>

				{/* 右側のタブ */}
				<div className="flex flex-1 items-center justify-evenly">
					{rightTabs.map((tab) => (
						<NavLink key={tab.id} tab={tab} />
					))}

					{/* その他メニュー */}
					<DropdownMenu>
						<DropdownMenuTrigger
							className={cn(
								"flex flex-col items-center justify-center gap-1 py-2",
								morePaths.some((path) => pathname.includes(`/${path}`))
									? "text-primary"
									: "text-muted-foreground",
							)}
						>
							<MoreHorizontal className="h-5 w-5" />
							<span className="text-xs">その他</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" align="end" className="w-56">
							{moreTabs.map((tab) => (
								<DropdownMenuItem key={tab.id} asChild>
									<Link href={`/koudens/${id}/${tab.id}`} className="flex items-center gap-2">
										{tab.icon}
										<span>{tab.label}</span>
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</nav>
	);
}
