"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, SortAsc } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface BookmarksFiltersProps {
	currentCategory?: string;
	currentSort: string;
	currentSearch?: string;
}

// ソートオプション
const SORT_OPTIONS = [
	{ value: "bookmark_date_desc", label: "ブックマーク日時（新しい順）" },
	{ value: "bookmark_date_asc", label: "ブックマーク日時（古い順）" },
	{ value: "publish_date_desc", label: "記事公開日（新しい順）" },
	{ value: "publish_date_asc", label: "記事公開日（古い順）" },
	{ value: "title_asc", label: "タイトル（A-Z）" },
	{ value: "title_desc", label: "タイトル（Z-A）" },
	{ value: "view_count_desc", label: "閲覧数（多い順）" },
	{ value: "view_count_asc", label: "閲覧数（少ない順）" },
] as const;

// よく使われるカテゴリー（実際のデータに基づいて調整）
const POPULAR_CATEGORIES = [
	"マナー",
	"基本",
	"返礼品",
	"お礼状",
	"プラン",
	"機能",
	"応用",
	"効率化",
] as const;

/**
 * ブックマーク一覧用のフィルター・検索コンポーネント
 */
export function BookmarksFilters({
	currentCategory,
	currentSort,
	currentSearch,
}: BookmarksFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchValue, setSearchValue] = useState(currentSearch || "");
	const debouncedSearch = useDebounce(searchValue, 300);

	// 検索値の変更をURLに反映
	useEffect(() => {
		const params = new URLSearchParams(searchParams);

		if (debouncedSearch) {
			params.set("search", debouncedSearch);
		} else {
			params.delete("search");
		}

		// ページを1に戻す
		params.delete("page");

		router.push(`/profile/bookmarks?${params.toString()}`, { scroll: false });
	}, [debouncedSearch, router, searchParams]);

	// フィルター変更ハンドラー
	const handleFilterChange = useCallback(
		(key: string, value: string | null) => {
			const params = new URLSearchParams(searchParams);

			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}

			// ページを1に戻す
			params.delete("page");

			router.push(`/profile/bookmarks?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// カテゴリフィルター変更
	const handleCategoryChange = (category: string) => {
		handleFilterChange("category", category === "all" ? null : category);
	};

	// ソート変更
	const handleSortChange = (sort: string) => {
		handleFilterChange("sort", sort);
	};

	// フィルタークリア
	const clearFilters = () => {
		setSearchValue("");
		router.push("/profile/bookmarks", { scroll: false });
	};

	// アクティブなフィルター数
	const activeFiltersCount = [
		currentCategory,
		currentSearch,
		currentSort !== "bookmark_date_desc" ? currentSort : null,
	].filter(Boolean).length;

	return (
		<div className="space-y-4">
			{/* 検索バー */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="記事タイトルや内容で検索..."
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					className="pl-10 pr-10"
				/>
				{searchValue && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setSearchValue("")}
						className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* フィルター・ソートコントロール */}
			<div className="flex flex-wrap gap-3 items-center">
				{/* カテゴリフィルター */}
				<div className="flex items-center gap-2">
					<Filter className="h-4 w-4 text-muted-foreground" />
					<Select value={currentCategory || "all"} onValueChange={handleCategoryChange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="カテゴリ" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">すべてのカテゴリ</SelectItem>
							{POPULAR_CATEGORIES.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* ソート */}
				<div className="flex items-center gap-2">
					<SortAsc className="h-4 w-4 text-muted-foreground" />
					<Select value={currentSort} onValueChange={handleSortChange}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="並び順" />
						</SelectTrigger>
						<SelectContent>
							{SORT_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* フィルタークリア */}
				{activeFiltersCount > 0 && (
					<Button variant="outline" size="sm" onClick={clearFilters}>
						<X className="h-4 w-4 mr-1" />
						フィルターをクリア ({activeFiltersCount})
					</Button>
				)}
			</div>

			{/* アクティブフィルター表示 */}
			{(currentCategory || currentSearch) && (
				<div className="flex flex-wrap gap-2">
					{currentCategory && (
						<Badge variant="secondary" className="flex items-center gap-1">
							カテゴリ: {currentCategory}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleCategoryChange("all")}
								className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
							>
								<X className="h-3 w-3" />
							</Button>
						</Badge>
					)}
					{currentSearch && (
						<Badge variant="secondary" className="flex items-center gap-1">
							検索: "{currentSearch}"
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSearchValue("")}
								className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
							>
								<X className="h-3 w-3" />
							</Button>
						</Badge>
					)}
				</div>
			)}
		</div>
	);
}
