import * as React from "react";
import { useEffect } from "react";
import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GuideCard } from "@/components/custom/guide-card";
import {
	Search,
	Filter,
	ArrowDownAZ,
	ArrowUpAZ,
	Columns,
	Building2,
	MapPin,
	User,
	UserRound,
	LayoutGrid,
	Table2,
} from "lucide-react";
import { permissionAtom, canUpdateKouden } from "@/store/permission";
import { useAtomValue } from "jotai";

interface SearchOption {
	value: string;
	label: string;
}

interface FilterOption {
	value: string;
	label: string;
}

interface SortOption {
	value: string;
	label: string;
}

export interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchOptions?: SearchOption[];
	filterColumn?: string;
	filterOptions?: FilterOption[];
	sortOptions?: SortOption[];
	columnLabels?: Record<string, string>;
	showColumnVisibility?: boolean;
	showSearch?: boolean;
	showFilter?: boolean;
	showSort?: boolean;
	showViewToggle?: boolean;
	viewMode?: "table" | "grid";
	onViewModeChange?: (mode: "table" | "grid") => void;
	children?: React.ReactNode;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortValue?: string;
	onSortChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
	table,
	searchOptions = [],
	filterColumn,
	filterOptions = [],
	sortOptions = [],
	columnLabels = {},
	showColumnVisibility = true,
	showSearch = true,
	showFilter = true,
	showSort = true,
	showViewToggle = false,
	viewMode = "table",
	onViewModeChange,
	children,
	searchValue,
	onSearchChange,
	sortValue,
	onSortChange,
}: DataTableToolbarProps<TData>) {
	const [globalFilter, setGlobalFilter] = React.useState(searchValue || "");
	const permission = useAtomValue(permissionAtom);

	// デスクトップサイズでテーブル表示にリセットする
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024 && viewMode === "grid" && onViewModeChange) {
				onViewModeChange("table");
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [viewMode, onViewModeChange]);

	// グローバル検索の処理
	const handleSearch = React.useCallback(
		(value: string) => {
			setGlobalFilter(value);
			if (onSearchChange) {
				onSearchChange(value);
			} else {
				table.setGlobalFilter(value);
			}
		},
		[table, onSearchChange],
	);

	// 検索オプションのアイコンマッピング
	const searchOptionIcons: Record<string, React.ReactNode> = {
		name: <User className="h-4 w-4" />,
		address: <MapPin className="h-4 w-4" />,
		organization: <Building2 className="h-4 w-4" />,
		position: <UserRound className="h-4 w-4" />,
	};

	return (
		<div className="flex flex-col lg:flex-row gap-4">
			{/* 検索セクション */}
			{showSearch && searchOptions.length > 0 && (
				<GuideCard
					content={
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Search className="h-5 w-5" />
								<h4 className="text-lg font-semibold">検索機能</h4>
							</div>
							<p className="text-sm text-muted-foreground">
								記録を素早く見つけるための検索機能です。
							</p>
							<div className="space-y-2">
								<h5 className="text-sm font-medium">検索対象</h5>
								<div className="grid grid-cols-2 gap-2">
									{searchOptions.map((option) => (
										<div
											key={option.value}
											className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
										>
											{searchOptionIcons[option.value]}
											<p className="font-medium text-sm">{option.label}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					}
				>
					<div className="border rounded-lg p-4 flex-1 hover:border-primary/50 transition-colors">
						<div className="relative">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={`${searchOptions.map((opt) => opt.label).join("・")}から検索...`}
								value={searchValue ?? globalFilter ?? ""}
								onChange={(event) => handleSearch(event.target.value)}
								className="pl-8 bg-background"
							/>
						</div>
					</div>
				</GuideCard>
			)}

			<div className="flex gap-4 justify-between">
				<div className="border rounded-lg p-4 min-w-[300px]">
					<div className="flex items-center gap-2">
						{/* フィルター機能 */}
						{showFilter && filterColumn && filterOptions.length > 0 && (
							<GuideCard
								content={
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Filter className="h-5 w-5" />
											<h4 className="text-lg font-semibold">フィルター機能</h4>
										</div>
										<p className="text-sm text-muted-foreground">
											特定の条件で記録を絞り込むことができます。
										</p>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<Select
										value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? "all"}
										onValueChange={(value) =>
											table.getColumn(filterColumn)?.setFilterValue(value === "all" ? "" : value)
										}
									>
										<SelectTrigger className="w-[160px] bg-background">
											<SelectValue placeholder="絞り込み" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">すべて</SelectItem>
											{filterOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</GuideCard>
						)}

						{/* 並び替え機能 */}
						{showSort && sortOptions.length > 0 && (
							<GuideCard
								content={
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<ArrowDownAZ className="h-5 w-5" />
											<h4 className="text-lg font-semibold">並び替え機能</h4>
										</div>
										<p className="text-sm text-muted-foreground">
											記録を様々な条件で整理して表示できます。
										</p>
										<div className="space-y-2">
											<h5 className="text-sm font-medium">並び替えオプション</h5>
											<div className="grid gap-2">
												{sortOptions
													.filter((option) => {
														const columnId = option.value.split("_")[0];
														const column = table.getAllColumns().find((col) => col.id === columnId);
														return column?.getIsVisible?.() ?? false;
													})
													.map((option) => (
														<div
															key={option.value}
															className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
														>
															{option.value.includes("desc") ? (
																<ArrowDownAZ className="h-4 w-4" />
															) : (
																<ArrowUpAZ className="h-4 w-4" />
															)}
															<p className="font-medium text-sm">{option.label}</p>
														</div>
													))}
											</div>
										</div>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<Select
										value={sortValue ?? "default"}
										onValueChange={(value) => {
											if (onSortChange) {
												onSortChange(value);
											} else {
												if (value === "default") {
													table.resetSorting();
													return;
												}
												const [field, direction] = value.split("_");
												table.setSorting([
													{
														id: field ?? "",
														desc: direction === "desc",
													},
												]);
											}
										}}
									>
										<SelectTrigger className="w-[160px] bg-background">
											<SelectValue placeholder="並び替え" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="default">並び替え</SelectItem>
											{sortOptions
												.filter((option) => {
													const columnId = option.value.split("_")[0];
													const column = table.getAllColumns().find((col) => col.id === columnId);
													return column?.getIsVisible?.() ?? false;
												})
												.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</GuideCard>
						)}

						{/* 表示列のカスタマイズ */}
						{showColumnVisibility && (
							<GuideCard
								content={
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<Columns className="h-5 w-5" />
											<h4 className="text-lg font-semibold">表示列のカスタマイズ</h4>
										</div>
										<p className="text-sm text-muted-foreground">
											必要な情報だけを表示して、見やすい表を作成できます。
										</p>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" className="w-[160px] bg-background">
												<Columns className="h-4 w-4" />
												<span>表示列を選択</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-[200px]">
											{table
												.getAllColumns()
												.filter((column) => column.getCanHide())
												.map((column) => {
													return (
														<DropdownMenuCheckboxItem
															key={column.id}
															className="capitalize"
															checked={column.getIsVisible()}
															onCheckedChange={(value) => column.toggleVisibility(!!value)}
														>
															{columnLabels[column.id] || column.id}
														</DropdownMenuCheckboxItem>
													);
												})}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</GuideCard>
						)}
						{/* 表示モードの切り替え */}
						{showViewToggle && onViewModeChange && (
							<GuideCard
								content={
									<div className="space-y-4">
										<div className="flex items-center gap-2">
											<LayoutGrid className="h-5 w-5" />
											<h4 className="text-lg font-semibold">表示切替</h4>
										</div>
										<p className="text-sm text-muted-foreground">
											テーブル表示とグリッド表示を切り替えることができます。
										</p>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="icon" className="h-8 w-8 bg-background">
												{viewMode === "table" ? (
													<Table2 className="h-4 w-4" />
												) : (
													<LayoutGrid className="h-4 w-4" />
												)}
												<span className="sr-only">表示切替</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => onViewModeChange("table")}
												className="flex items-center gap-2"
											>
												<Table2 className="h-4 w-4" />
												テーブル
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onViewModeChange("grid")}
												className="flex items-center gap-2"
											>
												<LayoutGrid className="h-4 w-4" />
												グリッド
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</GuideCard>
						)}
					</div>
				</div>
				{/* 編集権限のあるユーザーにのみchildrenを表示 */}
				{canUpdateKouden(permission) && children}
			</div>
		</div>
	);
}
