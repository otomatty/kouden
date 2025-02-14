"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	Table2,
	Box,
	BarChart3,
	Gift,
	Mail,
	Settings,
	Plus,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateButtonContainer } from "@/app/(protected)/koudens/[id]/_components/_common/create-button-container";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";

interface BottomNavigationProps {
	id: string;
	entries: Entry[];
	relationships: Relationship[];
	onEntryCreated?: (entry: Entry) => void;
}

/**
 * モバイル用のボトムナビゲーションコンポーネント
 * - 香典帳詳細画面のナビゲーションを提供
 * - モバイル時のみ表示される
 * - メインメニューと追加メニューを縦方向のスライドで切り替え可能
 * - 中央に新規作成ボタンを配置
 * - 現在のパスに基づいてアクティブな項目を強調表示
 */
export function BottomNavigation({
	id,
	entries,
	relationships,
	onEntryCreated,
}: BottomNavigationProps) {
	const pathname = usePathname();
	const [showMoreMenu, setShowMoreMenu] = useState(false);

	const mainTabs = [
		{ id: "entries", label: "ご香典", icon: <Table2 className="h-5 w-5" /> },
		{ id: "return_records", label: "香典返し", icon: <Box className="h-5 w-5" /> },
		{ id: "statistics", label: "統計", icon: <BarChart3 className="h-5 w-5" /> },
	];

	const moreTabs = [
		{ id: "offerings", label: "お供物", icon: <Gift className="h-5 w-5" /> },
		{ id: "telegrams", label: "弔電", icon: <Mail className="h-5 w-5" /> },
		{ id: "settings", label: "設定", icon: <Settings className="h-5 w-5" /> },
	];

	const NavLink = ({ tab }: { tab: (typeof mainTabs)[0] }) => {
		const isActive = pathname.includes(`/${tab.id}`);
		return (
			<Link
				href={`/koudens/${id}/${tab.id}`}
				className={cn(
					"flex-1 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors p-1",
					isActive
						? "text-primary bg-primary/10 font-medium [&_svg]:text-primary"
						: "text-muted-foreground hover:text-primary hover:bg-muted [&_svg]:text-muted-foreground",
				)}
			>
				{tab.icon}
				<span className="text-xs">{tab.label}</span>
			</Link>
		);
	};

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background md:hidden">
			<div className="relative h-16">
				{/* 中央の新規作成ボタン - アニメーションの外に配置 */}
				<div className="absolute left-1/2 -translate-x-1/2 z-10">
					<div className="relative flex h-16 w-16 items-center justify-center">
						<div className="absolute top-0 left-1/2 h-16 w-full overflow-hidden -translate-x-1/2">
							<div className="absolute bottom-6 h-16 w-full rounded-full bg-muted" />
						</div>
						<div className="absolute -top-5">
							<div className="flex flex-col items-center gap-1">
								<CreateButtonContainer
									koudenId={id}
									entries={entries}
									relationships={relationships}
									onEntryCreated={onEntryCreated}
								/>
								<span className="text-xs">新規追加</span>
							</div>
						</div>
					</div>
				</div>

				<AnimatePresence initial={false}>
					<motion.div
						key={showMoreMenu ? "more" : "main"}
						initial={{ opacity: 0, y: showMoreMenu ? -20 : 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: showMoreMenu ? 20 : -20 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 flex items-center"
					>
						{showMoreMenu ? (
							// 追加メニュー
							<>
								<div className="flex flex-1 items-center justify-between gap-1 py-2 px-1 h-full">
									{moreTabs.slice(0, 2).map((tab) => (
										<NavLink key={tab.id} tab={tab} />
									))}
								</div>

								{/* 中央のスペース確保 */}
								<div className="w-16" />

								<div className="flex flex-1 items-center justify-between gap-1 py-2 px-1 h-full">
									{moreTabs.slice(-1).map((tab) => (
										<NavLink key={tab.id} tab={tab} />
									))}
									<button
										type="button"
										onClick={() => setShowMoreMenu(false)}
										className={cn(
											"flex-1 flex flex-col items-center justify-between gap-1 p-1",
											"text-muted-foreground hover:text-primary transition-colors",
										)}
									>
										<ChevronDown className="h-5 w-5" />
										<span className="text-xs">戻る</span>
									</button>
								</div>
							</>
						) : (
							// メインメニュー
							<>
								<div className="flex flex-1 items-center justify-between gap-1 py-2 px-1 h-full">
									{mainTabs.slice(0, 2).map((tab) => (
										<NavLink key={tab.id} tab={tab} />
									))}
								</div>

								{/* 中央のスペース確保 */}
								<div className="w-16" />

								<div className="flex flex-1 items-center justify-between gap-1 py-2 px-1 h-full">
									{mainTabs.slice(2).map((tab) => (
										<NavLink key={tab.id} tab={tab} />
									))}
									{/* メニュー切り替えボタン */}
									<button
										type="button"
										onClick={() => setShowMoreMenu(!showMoreMenu)}
										className={cn(
											"flex-1 flex flex-col items-center justify-center gap-1 p-1",
											"text-muted-foreground hover:text-primary transition-colors",
										)}
									>
										<ChevronUp className="h-5 w-5" />
										<span className="text-xs">その他</span>
									</button>
								</div>
							</>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</nav>
	);
}
