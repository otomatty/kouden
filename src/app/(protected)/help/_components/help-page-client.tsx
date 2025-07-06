"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	HelpCircle,
	Search,
	Clock,
	ChevronLeft,
	ChevronRight,
	Loader2,
	AlertCircle,
	BookOpen,
	FileText,
	Settings,
	ExternalLink,
	Mail,
	Phone,
	MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { QuickHelpItem } from "@/types/help";
import { searchHelpItems } from "@/app/_actions/help/help-items";
import { getIcon, getActionIcon } from "@/utils/help-icons";

const ITEMS_PER_PAGE = 12;

/**
 * ヘルプページのメインコンポーネント
 * 統合的なヘルプ情報を提供する
 */
export function HelpPageClient() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedSort, setSelectedSort] = useState<string>("relevance");
	const [currentPage, setCurrentPage] = useState(1);
	const [helpItems, setHelpItems] = useState<QuickHelpItem[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// カテゴリ定義
	const categoryOptions = [
		{ value: "all", label: "すべて", icon: HelpCircle },
		{ value: "basic", label: "基本操作", icon: BookOpen },
		{ value: "manners", label: "マナー", icon: FileText },
		{ value: "advanced", label: "応用機能", icon: Settings },
		{ value: "troubleshooting", label: "トラブル", icon: HelpCircle },
	];

	// ソート定義
	const sortOptions = [
		{ value: "relevance", label: "関連度順" },
		{ value: "popularity", label: "人気順" },
		{ value: "date", label: "更新順" },
	];

	// データ取得
	useEffect(() => {
		const fetchHelpItems = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const result = await searchHelpItems({
					query: searchQuery,
					category: selectedCategory === "all" ? undefined : selectedCategory,
					sortBy: selectedSort as "relevance" | "popularity" | "date",
					limit: ITEMS_PER_PAGE,
				});

				setHelpItems(result.items);
				setTotalCount(result.totalCount);
			} catch (err) {
				console.error("Help items fetch error:", err);
				setError("データの取得中にエラーが発生しました");
			} finally {
				setIsLoading(false);
			}
		};

		fetchHelpItems();
	}, [searchQuery, selectedCategory, selectedSort]);

	// 検索・フィルター変更時にページをリセット
	useEffect(() => {
		setCurrentPage(1);
	}, []);

	// ページネーション計算
	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
	const canGoPrev = currentPage > 1;
	const canGoNext = currentPage < totalPages;

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

	const getSourceTypeLabel = (sourceType: QuickHelpItem["sourceType"]) => {
		switch (sourceType) {
			case "manual":
				return "マニュアル";
			case "blog":
				return "ブログ記事";
			case "static":
				return "ガイド";
			default:
				return "ヘルプ";
		}
	};

	const getSourceTypeColor = (sourceType: QuickHelpItem["sourceType"]) => {
		switch (sourceType) {
			case "manual":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "blog":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "static":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* サイドバー */}
					<div className="lg:col-span-1 space-y-6">
						{/* 検索・フィルター */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">検索・絞り込み</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* 検索バー */}
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="キーワードで検索..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10"
									/>
								</div>

								{/* カテゴリフィルター */}
								<div className="space-y-2">
									<label htmlFor="category" className="text-sm font-medium">
										カテゴリ
									</label>
									<Select value={selectedCategory} onValueChange={setSelectedCategory}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{categoryOptions.map((category) => (
												<SelectItem key={category.value} value={category.value}>
													<div className="flex items-center gap-2">
														<category.icon className="h-4 w-4" />
														{category.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* ソート */}
								<div className="space-y-2">
									<label htmlFor="sort" className="text-sm font-medium">
										並び順
									</label>
									<Select value={selectedSort} onValueChange={setSelectedSort}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{sortOptions.map((sort) => (
												<SelectItem key={sort.value} value={sort.value}>
													{sort.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>

						{/* サポート情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">サポート</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-sm text-muted-foreground">
									解決しない場合は、お気軽にサポートまでお問い合わせください。
								</div>

								<div className="space-y-2">
									<Button variant="outline" size="sm" asChild className="w-full justify-start">
										<Link href="/contact">
											<Mail className="h-4 w-4 mr-2" />
											お問い合わせ
										</Link>
									</Button>
									<Button variant="outline" size="sm" asChild className="w-full justify-start">
										<Link href="/faq">
											<HelpCircle className="h-4 w-4 mr-2" />
											よくある質問
										</Link>
									</Button>
									<Button variant="outline" size="sm" asChild className="w-full justify-start">
										<Link href="/manuals">
											<BookOpen className="h-4 w-4 mr-2" />
											マニュアル
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* メインコンテンツ */}
					<div className="lg:col-span-3">
						{/* 検索結果情報 */}
						<div className="mb-6">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div className="text-sm text-muted-foreground">
									{isLoading ? (
										"検索中..."
									) : (
										<>
											{totalCount}件のヘルプ情報が見つかりました
											{searchQuery && (
												<span className="ml-2">
													「<strong>{searchQuery}</strong>」の検索結果
												</span>
											)}
										</>
									)}
								</div>
								{totalPages > 1 && (
									<div className="text-sm text-muted-foreground">
										{currentPage} / {totalPages} ページ
									</div>
								)}
							</div>
						</div>

						{/* コンテンツエリア */}
						{isLoading ? (
							<div className="flex items-center justify-center py-16">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<span className="ml-2 text-muted-foreground">検索中...</span>
							</div>
						) : error ? (
							<div className="flex items-center justify-center py-16 text-center">
								<div className="space-y-4">
									<AlertCircle className="h-8 w-8 text-destructive mx-auto" />
									<p className="text-destructive">{error}</p>
									<Button variant="outline" onClick={() => window.location.reload()}>
										再読み込み
									</Button>
								</div>
							</div>
						) : helpItems.length === 0 ? (
							<div className="text-center py-16">
								<HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
								<h3 className="text-lg font-medium mb-2">該当するヘルプが見つかりませんでした</h3>
								<p className="text-muted-foreground mb-4">
									別のキーワードで検索するか、カテゴリを変更してみてください。
								</p>
								<Button
									variant="outline"
									onClick={() => {
										setSearchQuery("");
										setSelectedCategory("all");
									}}
								>
									検索条件をリセット
								</Button>
							</div>
						) : (
							<>
								{/* ヘルプアイテム一覧 */}
								<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
									{helpItems.map((item) => {
										const ActionIcon = getActionIcon(item.actionType);
										const ItemIcon = getIcon(item.icon || "HelpCircle");

										return (
											<Card key={item.id} className="group hover:shadow-md transition-shadow">
												<CardContent className="p-4">
													<Link href={item.actionHref} className="block">
														<div className="flex items-start gap-3">
															<div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors flex-shrink-0">
																<ItemIcon className="h-5 w-5 text-primary" />
															</div>
															<div className="flex-1 min-w-0">
																<div className="flex items-start justify-between gap-2 mb-2">
																	<h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
																		{item.title}
																	</h3>
																	<ActionIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
																</div>
																<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
																	{item.description}
																</p>
																<div className="flex items-center gap-2 mb-3">
																	<Badge className={cn("text-xs", getCategoryColor(item.category))}>
																		{categoryOptions.find((c) => c.value === item.category)?.label}
																	</Badge>
																	<Badge
																		variant="outline"
																		className={cn("text-xs", getSourceTypeColor(item.sourceType))}
																	>
																		{getSourceTypeLabel(item.sourceType)}
																	</Badge>
																	{item.isPopular && (
																		<Badge variant="secondary" className="text-xs">
																			人気
																		</Badge>
																	)}
																</div>
																<div className="flex items-center justify-between text-xs text-muted-foreground">
																	<div className="flex items-center gap-1">
																		<Clock className="h-3 w-3" />
																		<span>{item.estimatedTime}</span>
																	</div>
																	<span className="text-primary font-medium">
																		{item.actionLabel}
																	</span>
																</div>
															</div>
														</div>
													</Link>
												</CardContent>
											</Card>
										);
									})}
								</div>

								{/* ページネーション */}
								{totalPages > 1 && (
									<div className="flex items-center justify-center gap-2 mt-8">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={!canGoPrev}
										>
											<ChevronLeft className="h-4 w-4 mr-1" />
											前へ
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
												const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
												return (
													<Button
														key={pageNum}
														variant={currentPage === pageNum ? "default" : "outline"}
														size="sm"
														onClick={() => setCurrentPage(pageNum)}
														className="w-8 h-8 p-0"
													>
														{pageNum}
													</Button>
												);
											})}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={!canGoNext}
										>
											次へ
											<ChevronRight className="h-4 w-4 ml-1" />
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
