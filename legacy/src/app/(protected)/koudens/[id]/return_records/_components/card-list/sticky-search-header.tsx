"use client";

// library
import { useState } from "react";
// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

// Props
interface StickySearchHeaderProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	onAddReturn: () => void;
}

// ステータスオプション
const statusOptions = [
	{ value: "all", label: "全て" },
	{ value: "PENDING", label: "未完了", color: "secondary" },
	{ value: "IN_PROGRESS", label: "進行中", color: "default" },
	{ value: "COMPLETED", label: "完了", color: "default" },
	{ value: "CANCELLED", label: "キャンセル", color: "destructive" },
];

/**
 * StickySearchHeaderコンポーネント
 * 役割：モバイル用の固定検索・フィルターヘッダー
 */
export function StickySearchHeader({
	searchValue,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	onAddReturn,
}: StickySearchHeaderProps) {
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	// アクティブなフィルターをチェック
	const hasActiveFilters = statusFilter !== "all";

	// フィルタークリア
	const clearAllFilters = () => {
		onStatusFilterChange("all");
	};

	return (
		<div className="sticky top-0 z-10 bg-background border-b">
			<div className="flex items-center gap-2 p-4">
				{/* 検索フィールド */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="名前、組織で検索..."
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* フィルターボタン */}
				<Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" size="sm" className="shrink-0 relative">
							<Filter className="h-4 w-4" />
							{hasActiveFilters && (
								<div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="h-[300px]">
						<div className="space-y-4">
							{/* ヘッダー */}
							<div className="flex items-center justify-between">
								<h3 className="font-medium text-sm">フィルター</h3>
								{hasActiveFilters && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearAllFilters}
										className="h-auto p-1"
									>
										<X className="h-4 w-4 mr-1" />
										クリア
									</Button>
								)}
							</div>

							{/* フィルター設定 */}
							<div className="space-y-4">
								<div>
									<Label className="text-xs text-muted-foreground mb-2 block">ステータス</Label>
									<Select value={statusFilter} onValueChange={onStatusFilterChange}>
										<SelectTrigger className="h-9">
											<SelectValue placeholder="ステータスを選択" />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<Badge
															variant={option.color as "secondary" | "default" | "destructive"}
															className="text-xs"
														>
															{option.label}
														</Badge>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* アクティブフィルター表示 */}
							{hasActiveFilters && (
								<div className="flex flex-wrap gap-2">
									{statusFilter !== "all" && (
										<Badge variant="secondary" className="text-xs">
											{statusOptions.find((opt) => opt.value === statusFilter)?.label}
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onStatusFilterChange("all")}
												className="h-auto p-0 ml-1 hover:bg-transparent"
											>
												<X className="h-3 w-3" />
											</Button>
										</Badge>
									)}
								</div>
							)}
						</div>
					</SheetContent>
				</Sheet>

				{/* 新規追加ボタン */}
				<Button size="sm" onClick={onAddReturn} className="shrink-0">
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
