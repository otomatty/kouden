"use client";

import { memo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	HelpCircle,
	Search,
	Clock,
	ChevronDown,
	ChevronUp,
	Mail,
	Loader2,
	AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { QuickHelpItem } from "@/types/help";
import { searchHelpItems } from "@/app/_actions/help/help-items";
import { getIcon, getActionIcon } from "@/utils/help-icons";

interface QuickHelpAreaProps {
	className?: string;
	showSearch?: boolean;
	maxItems?: number;
}

/**
 * クイックヘルプエリア
 * よくある質問や困りごとに即座にアクセスできるセクション
 */
export const QuickHelpArea = memo(function QuickHelpArea({
	className = "",
	showSearch = true,
	maxItems = 8,
}: QuickHelpAreaProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [isExpanded, setIsExpanded] = useState(false);
	const [helpItems, setHelpItems] = useState<QuickHelpItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// カテゴリ定義
	const categoryOptions = [
		{ value: "all", label: "すべて", icon: HelpCircle },
		{ value: "basic", label: "基本操作", icon: getIcon("BookOpen") },
		{ value: "manners", label: "マナー", icon: getIcon("FileText") },
		{ value: "advanced", label: "応用機能", icon: getIcon("Settings") },
		{ value: "troubleshooting", label: "トラブル", icon: HelpCircle },
	];

	// データ取得
	useEffect(() => {
		const fetchHelpItems = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const result = await searchHelpItems({
					query: "",
					limit: maxItems * 2, // 余裕を持って取得
					sortBy: "relevance",
				});

				setHelpItems(result.items);
			} catch (err) {
				console.error("Help items fetch error:", err);
				setError("データの取得中にエラーが発生しました");
			} finally {
				setIsLoading(false);
			}
		};

		fetchHelpItems();
	}, [maxItems]);

	// 検索とフィルタリング処理
	const filteredItems = helpItems.filter((item) => {
		const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
		const matchesSearch =
			searchQuery === "" ||
			item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

		return matchesCategory && matchesSearch;
	});

	// 表示アイテム数の制御
	const displayItems = isExpanded ? filteredItems : filteredItems.slice(0, maxItems);

	const notLoading = !isLoading;
	const noError = !error;
	const isDataReady = notLoading && noError;
	const shouldShowItems = isDataReady;
	const shouldShowExpandButton = isDataReady && filteredItems.length > maxItems;

	const getCategoryColor = (category: QuickHelpItem["category"]) => {
		switch (category) {
			case "basic":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "manners":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "advanced":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "troubleshooting":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<Card data-tour="quick-help-area" className={cn("", className)}>
			<CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
				<CardTitle className="text-base sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<div className="flex items-center gap-2">
						<HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
						<span>クイックヘルプ</span>
					</div>
					<Badge variant="secondary" className="text-xs w-fit">
						よくある質問
					</Badge>
				</CardTitle>
				<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					困ったときはここから。すぐに解決策を見つけられます。
				</p>
			</CardHeader>

			<CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
				{/* 検索とフィルター */}
				{showSearch && (
					<div className="space-y-2 sm:space-y-3">
						{/* 検索バー */}
						<div className="relative">
							<Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
							<Input
								placeholder="ヘルプを検索..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
								disabled={isLoading}
							/>
						</div>

						{/* カテゴリフィルター */}
						<div className="flex flex-wrap gap-1 sm:gap-2">
							{categoryOptions.map((category) => (
								<Button
									key={category.value}
									variant={selectedCategory === category.value ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCategory(category.value)}
									className="h-7 sm:h-8 text-xs px-2 sm:px-3"
									disabled={isLoading}
								>
									<category.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
									<span className="hidden xs:inline sm:inline">{category.label}</span>
									<span className="xs:hidden sm:hidden">{category.label.slice(0, 2)}</span>
								</Button>
							))}
						</div>
					</div>
				)}

				{/* ローディング状態 */}
				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
						<span className="ml-2 text-sm text-muted-foreground">ヘルプ情報を読み込み中...</span>
					</div>
				)}

				{/* エラー状態 */}
				{error && (
					<div className="flex items-center justify-center py-8 text-center">
						<div className="space-y-2">
							<AlertCircle className="h-6 w-6 text-destructive mx-auto" />
							<p className="text-sm text-destructive">{error}</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => window.location.reload()}
								className="text-xs"
							>
								再読み込み
							</Button>
						</div>
					</div>
				)}

				{/* ヘルプアイテム一覧 */}
				{shouldShowItems && (
					<div className="space-y-2 sm:space-y-3">
						{displayItems.length === 0 ? (
							<div className="text-center py-6 sm:py-8 text-muted-foreground">
								<HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
								<p className="text-xs sm:text-sm">該当するヘルプが見つかりませんでした</p>
							</div>
						) : (
							displayItems.map((item) => {
								const ActionIcon = getActionIcon(item.actionType);
								const ItemIcon = getIcon(item.icon || "HelpCircle");

								return (
									<Link
										key={item.id}
										href={item.actionHref}
										className="block group p-3 sm:p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-200"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
												<div className="p-1.5 sm:p-2 rounded-lg bg-muted group-hover:bg-background transition-colors flex-shrink-0">
													<ItemIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
														<h4 className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors break-words">
															{item.title}
														</h4>
														<div className="flex items-center gap-1 flex-wrap">
															{item.isPopular && (
																<Badge variant="secondary" className="text-xs">
																	人気
																</Badge>
															)}
															<Badge className={cn("text-xs", getCategoryColor(item.category))}>
																{categoryOptions.find((c) => c.value === item.category)?.label}
															</Badge>
														</div>
													</div>
													<p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed break-words">
														{item.description}
													</p>
													<div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 text-xs text-muted-foreground">
														<div className="flex items-center gap-1">
															<Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
															<span>{item.estimatedTime}</span>
														</div>
														<span className="hidden xs:inline">•</span>
														<span className="text-primary font-medium truncate">
															{item.actionLabel}
														</span>
													</div>
												</div>
											</div>
											<div className="flex items-center ml-2 sm:ml-3 flex-shrink-0">
												<ActionIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
											</div>
										</div>
									</Link>
								);
							})
						)}
					</div>
				)}

				{/* 展開/折りたたみボタン */}
				{shouldShowExpandButton && (
					<div className="pt-2 border-t border-border">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsExpanded(!isExpanded)}
							className="w-full justify-center text-xs sm:text-sm h-8 sm:h-10"
						>
							{isExpanded ? (
								<>
									<span>少なく表示</span>
									<ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
								</>
							) : (
								<>
									<span>さらに表示 ({filteredItems.length - maxItems}件)</span>
									<ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
								</>
							)}
						</Button>
					</div>
				)}

				{/* フッター */}
				<div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-border">
					<div className="flex flex-col xs:flex-row items-center justify-between gap-2 xs:gap-0 text-xs text-muted-foreground">
						<span className="text-center xs:text-left">解決しない場合は</span>
						<Button variant="ghost" size="sm" asChild className="w-full xs:w-auto h-8 text-xs">
							<Link href="/contact" className="flex items-center justify-center gap-1">
								<Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
								お問い合わせ
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
});
