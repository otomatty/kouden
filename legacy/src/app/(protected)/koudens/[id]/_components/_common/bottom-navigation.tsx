"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigationMode } from "@/context/navigation-mode";
import { cn } from "@/lib/utils";
import {
	Table2,
	Box,
	BarChart3,
	Gift,
	Mail,
	Settings,
	ChevronUp,
	ChevronDown,
	FileDown,
	HelpCircle,
	PackageCheck,
	Plus,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateButtonContainer } from "./create-button-container";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
	id?: string;
	entries?: Entry[];
	relationships?: Relationship[];
}

/**
 * モバイル用のボトムナビゲーションコンポーネント
 * - 香典帳詳細画面のナビゲーションを提供
 * - モバイル時のみ表示される
 * - メインメニューと追加メニューを縦方向のスライドで切り替え可能
 * - 中央に新規作成ボタンを配置
 * - 現在のパスに基づいてアクティブな項目を強調表示
 */
export function BottomNavigation({ id, entries = [], relationships = [] }: BottomNavigationProps) {
	const mode = useNavigationMode();
	const pathname = usePathname();
	const [showMoreMenu, setShowMoreMenu] = useState(false);
	const [localEntries, setLocalEntries] = useState<Entry[]>(entries);
	const [localRelationships] = useState<Relationship[]>(relationships);
	const handleEntryCreated = (entry: Entry) => setLocalEntries((prev) => [entry, ...prev]);

	if (mode === "none") return null;
	if (mode === "global") {
		const globalAction = {
			component: <CreateButtonContainer koudenId="" entries={[]} relationships={[]} />,
			label: "新規作成",
		};
		return (
			<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background md:hidden">
				<div className="relative h-16">
					{globalAction && (
						<div className="absolute left-1/2 -translate-x-1/2 z-10">
							<div className="relative flex h-16 w-16 items-center justify-center">
								<div className="absolute top-0 left-1/2 h-16 w-full overflow-hidden -translate-x-1/2">
									<div className="absolute bottom-6 h-16 w-full rounded-full bg-muted" />
								</div>
								<div className="absolute -top-5">
									<div className="flex flex-col items-center gap-1">
										{globalAction.component}
										<span className="text-xs">{globalAction.label}</span>
									</div>
								</div>
							</div>
						</div>
					)}
					<div className="flex justify-between items-center h-16 px-4">
						<div className="flex items-center space-x-4">
							{/* 左サイドナビ */}
							<Link
								href="/koudens"
								className={cn(
									"flex flex-col items-center justify-center gap-1 rounded-lg transition-colors p-1",
									pathname.startsWith("/koudens")
										? "text-primary bg-primary/10 font-medium [&_svg]:text-primary"
										: "text-muted-foreground hover:text-primary hover:bg-muted [&_svg]:text-muted-foreground",
								)}
							>
								<Table2 className="h-5 w-5" />
								<span className="text-xs">香典帳</span>
							</Link>
							<Link
								href="/guide"
								className={cn(
									"flex flex-col items-center justify-center gap-1 rounded-lg transition-colors p-1",
									pathname.startsWith("/guide")
										? "text-primary bg-primary/10 font-medium [&_svg]:text-primary"
										: "text-muted-foreground hover:text-primary hover:bg-muted [&_svg]:text-muted-foreground",
								)}
							>
								<HelpCircle className="h-5 w-5" />
								<span className="text-xs">ガイド</span>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							{/* 右サイドナビ */}
							<Link
								href="/settings"
								className={cn(
									"flex flex-col items-center justify-center gap-1 rounded-lg transition-colors p-1",
									pathname.startsWith("/settings")
										? "text-primary bg-primary/10 font-medium [&_svg]:text-primary"
										: "text-muted-foreground hover:text-primary hover:bg-muted [&_svg]:text-muted-foreground",
								)}
							>
								<Settings className="h-5 w-5" />
								<span className="text-xs">設定</span>
							</Link>
						</div>
					</div>
				</div>
			</nav>
		);
	}
	if (!id) return null;

	const getActionButton = (path: string) => {
		// 新規作成が必要なページ
		if (path.includes("/entries")) {
			return {
				component: (
					<CreateButtonContainer
						koudenId={id}
						entries={localEntries}
						relationships={localRelationships}
						onEntryCreated={handleEntryCreated}
						data-tour="add-entry-button"
					/>
				),
				label: "香典を登録",
			};
		}
		if (path.includes("/offerings")) {
			return {
				component: (
					<CreateButtonContainer
						koudenId={id}
						entries={localEntries}
						relationships={localRelationships}
						onEntryCreated={handleEntryCreated}
						data-tour="add-offering-button"
					/>
				),
				label: "供物を追加",
			};
		}
		if (path.includes("/telegrams")) {
			return {
				component: (
					<CreateButtonContainer
						koudenId={id}
						entries={localEntries}
						relationships={localRelationships}
						onEntryCreated={handleEntryCreated}
						data-tour="add-telegram-button"
					/>
				),
				label: "弔電を追加",
			};
		}

		// 代替アクションが必要なページ
		if (path.includes("/return_records")) {
			return {
				component: (
					<Button
						size="icon"
						className="h-14 w-14 rounded-full shadow-lg"
						onClick={() => {
							// TODO: 発送状況の確認機能の実装
							console.log("発送状況の確認");
						}}
						data-tour="check-delivery-status-button"
					>
						<PackageCheck className="h-6 w-6" />
					</Button>
				),
				label: "発送状況",
			};
		}
		if (path.includes("/statistics")) {
			return {
				component: (
					<Button
						size="icon"
						className="h-14 w-14 rounded-full shadow-lg"
						onClick={() => {
							// TODO: PDF出力機能の実装
							console.log("PDF出力");
						}}
						data-tour="export-pdf-button"
					>
						<FileDown className="h-6 w-6" />
					</Button>
				),
				label: "PDF出力",
			};
		}
		if (path.includes("/settings")) {
			return {
				component: (
					<Button
						size="icon"
						className="h-14 w-14 rounded-full shadow-lg"
						onClick={() => {
							// TODO: ヘルプ表示機能の実装
							console.log("ヘルプ表示");
						}}
						data-tour="help-button"
					>
						<HelpCircle className="h-6 w-6" />
					</Button>
				),
				label: "ヘルプ",
			};
		}

		return null;
	};

	const mainTabs = [
		{ id: "entries", label: "ご香典", icon: <Table2 className="h-5 w-5" /> },
		{ id: "return_records", label: "お返し", icon: <Box className="h-5 w-5" /> },
		{ id: "statistics", label: "統計", icon: <BarChart3 className="h-5 w-5" /> },
	];

	const moreTabs = [
		{ id: "offerings", label: "お供物", icon: <Gift className="h-5 w-5" /> },
		{ id: "telegrams", label: "弔電", icon: <Mail className="h-5 w-5" /> },
		{ id: "settings", label: "設定", icon: <Settings className="h-5 w-5" /> },
	];

	const NavLink = ({ tab }: { tab: (typeof mainTabs)[0] }) => {
		const isActive = pathname.includes(`/${tab.id}`);
		// 管理者モードかどうかを判定
		const isAdminMode = pathname.startsWith("/admin/koudens/");
		const basePath = isAdminMode ? `/admin/koudens/${id}` : `/koudens/${id}`;

		return (
			<Link
				href={`${basePath}/${tab.id}`}
				data-tour={tab.id === "entries" ? "bottom-nav-entries" : undefined}
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

	const action = getActionButton(pathname);

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-muted bg-background md:hidden">
			<div className="relative h-16">
				{/* 中央の新規作成ボタン - アクションがあるときだけ表示 */}
				{action && (
					<div className="absolute left-1/2 -translate-x-1/2 z-10">
						<div className="relative flex h-16 w-16 items-center justify-center">
							<div className="absolute top-0 left-1/2 h-16 w-full overflow-hidden -translate-x-1/2">
								<div className="absolute bottom-6 h-16 w-full rounded-full bg-muted" />
							</div>
							<div className="absolute -top-5">
								<div className="flex flex-col items-center gap-1">
									{action.component}
									<span className="text-xs">{action.label}</span>
								</div>
							</div>
						</div>
					</div>
				)}

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
