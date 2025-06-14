"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ReturnItemCard } from "./return-item-card";
import type { ReturnItem } from "@/types/return-records";

// TODO: 型定義を実装後にimport
// import type { ReturnItem } from "@/types/return-items";

interface ReturnItemsGridProps {
	items: ReturnItem[];
	onEdit: (item: ReturnItem) => void;
	onDelete: (itemId: string) => void;
	onToggleActive: (itemId: string, isActive: boolean) => void;
	isLoading?: boolean;
}

type SortOption = "name" | "price" | "category" | "sort_order";
type SortDirection = "asc" | "desc";
type SortValue = string | number;

/**
 * 返礼品グリッド表示コンポーネント
 * 役割：返礼品の一覧表示、検索、フィルタリング、ソート機能を提供
 */
export function ReturnItemsGrid({
	items,
	onEdit,
	onDelete,
	onToggleActive,
	isLoading = false,
}: ReturnItemsGridProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [activeFilter, setActiveFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<SortOption>("sort_order");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// カテゴリオプション
	const categoryOptions = [
		{ value: "all", label: "全てのカテゴリ" },
		{ value: "FUNERAL_GIFT", label: "会葬品" },
		{ value: "GIFT_CARD", label: "ギフト券" },
		{ value: "FOOD", label: "食品" },
		{ value: "FLOWER", label: "花・植物" },
		{ value: "OTHER", label: "その他" },
	];

	// フィルタリングとソート処理
	const filteredAndSortedItems = useMemo(() => {
		const filtered = items.filter((item) => {
			// 検索クエリでフィルタ
			const matchesSearch =
				searchQuery === "" ||
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

			// カテゴリでフィルタ
			const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

			// アクティブ状態でフィルタ
			const matchesActive =
				activeFilter === "all" ||
				(activeFilter === "active" && item.is_active) ||
				(activeFilter === "inactive" && !item.is_active);

			return matchesSearch && matchesCategory && matchesActive;
		});

		// ソート処理
		filtered.sort((a, b) => {
			let aValue: SortValue;
			let bValue: SortValue;

			switch (sortBy) {
				case "name":
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case "price":
					aValue = a.price;
					bValue = b.price;
					break;
				case "category":
					aValue = a.category;
					bValue = b.category;
					break;
				case "sort_order":
					aValue = a.sort_order;
					bValue = b.sort_order;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
			if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [items, searchQuery, categoryFilter, activeFilter, sortBy, sortDirection]);

	// ソート方向の切り替え
	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	// アクティブなフィルタの数を計算
	const activeFiltersCount = useMemo(() => {
		let count = 0;
		if (searchQuery) count++;
		if (categoryFilter !== "all") count++;
		if (activeFilter !== "all") count++;
		return count;
	}, [searchQuery, categoryFilter, activeFilter]);

	// スケルトン用の固定キー配列を生成
	const skeletonKeys = useMemo(
		() => Array.from({ length: 8 }, (_, i) => `skeleton-item-${i}-${Date.now()}`),
		[],
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				{/* フィルタバーのスケルトン */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="h-10 bg-muted animate-pulse rounded flex-1" />
					<div className="h-10 w-32 bg-muted animate-pulse rounded" />
					<div className="h-10 w-32 bg-muted animate-pulse rounded" />
				</div>

				{/* グリッドのスケルトン */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{skeletonKeys.map((key) => (
						<div key={key} className="h-80 bg-muted animate-pulse rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* フィルタ・検索バー */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* 検索 */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="返礼品を検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* カテゴリフィルタ */}
				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-full sm:w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{categoryOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* アクティブ状態フィルタ */}
				<Select value={activeFilter} onValueChange={setActiveFilter}>
					<SelectTrigger className="w-full sm:w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">全て</SelectItem>
						<SelectItem value="active">表示中</SelectItem>
						<SelectItem value="inactive">非表示</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* ソート・表示オプション */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-2">
					{/* アクティブフィルタ表示 */}
					{activeFiltersCount > 0 && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<Filter className="h-3 w-3" />
							{activeFiltersCount}個のフィルタ
						</Badge>
					)}

					{/* 件数表示 */}
					<span className="text-sm text-muted-foreground">
						{filteredAndSortedItems.length}件の返礼品
					</span>
				</div>

				<div className="flex items-center gap-2">
					{/* ソート */}
					<Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="sort_order">表示順</SelectItem>
							<SelectItem value="name">名前</SelectItem>
							<SelectItem value="price">価格</SelectItem>
							<SelectItem value="category">カテゴリ</SelectItem>
						</SelectContent>
					</Select>

					{/* ソート方向 */}
					<Button variant="outline" size="sm" onClick={toggleSortDirection} className="px-3">
						{sortDirection === "asc" ? (
							<SortAsc className="h-4 w-4" />
						) : (
							<SortDesc className="h-4 w-4" />
						)}
					</Button>

					{/* 表示モード切り替え */}
					<div className="flex border rounded-md">
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="rounded-r-none"
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="rounded-l-none"
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* 返礼品グリッド */}
			{filteredAndSortedItems.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-muted-foreground">
						{items.length === 0 ? (
							<>
								<p className="text-lg mb-2">返礼品がまだ登録されていません</p>
								<p className="text-sm">「返礼品を追加」ボタンから最初の返礼品を登録してください</p>
							</>
						) : (
							<>
								<p className="text-lg mb-2">条件に一致する返礼品が見つかりません</p>
								<p className="text-sm">検索条件やフィルタを変更してみてください</p>
							</>
						)}
					</div>
				</div>
			) : (
				<div
					className={
						viewMode === "grid"
							? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
							: "space-y-4"
					}
				>
					{filteredAndSortedItems.map((item) => (
						<ReturnItemCard
							key={item.id}
							item={item}
							onEdit={onEdit}
							onDelete={onDelete}
							onToggleActive={onToggleActive}
						/>
					))}
				</div>
			)}
		</div>
	);
}
