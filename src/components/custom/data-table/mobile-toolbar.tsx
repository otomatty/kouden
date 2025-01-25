import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Drawer,
	DrawerContent,
	DrawerTrigger,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Search,
	Filter,
	ArrowDownAZ,
	ArrowUpAZ,
	Columns,
	SlidersHorizontal,
} from "lucide-react";

interface SearchOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	description?: string;
}

interface FilterOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	description?: string;
}

interface SortOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	description?: string;
}

export interface MobileDataTableToolbarProps<TData> {
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
}

export function MobileDataTableToolbar<TData>({
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
}: MobileDataTableToolbarProps<TData>) {
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [searchField, setSearchField] = React.useState(
		searchOptions[0]?.value || "",
	);

	// グローバル検索の処理
	const handleSearch = React.useCallback(
		(value: string) => {
			setGlobalFilter(value);
			table.setGlobalFilter(value);
		},
		[table],
	);

	// 現在選択されている検索オプションを取得
	const currentSearch = searchOptions.find(
		(option) => option.value === searchField,
	);

	return (
		<div className="sticky top-2 z-50 py-4">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
						{currentSearch?.icon || (
							<Search className="h-4 w-4 text-muted-foreground" />
						)}
					</div>
					<Input
						placeholder={`${currentSearch?.label || "検索"}...`}
						value={globalFilter}
						onChange={(e) => handleSearch(e.target.value)}
						className="w-full h-12 pl-9 pr-12 text-sm bg-background"
					/>
					<div className="absolute inset-y-0 right-1 flex items-center">
						<Drawer>
							<DrawerTrigger asChild>
								<Button variant="ghost" size="sm" className="h-7 px-2">
									<SlidersHorizontal className="h-4 w-4" />
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>検索と並び替え</DrawerTitle>
								</DrawerHeader>
								<div className="max-w-md mx-auto p-8">
									<Tabs defaultValue="search" className="px-4">
										<TabsList className="grid w-full grid-cols-3 mb-4">
											{showSearch && (
												<TabsTrigger value="search" className="text-sm">
													検索対象
												</TabsTrigger>
											)}
											{showSort && (
												<TabsTrigger value="sort" className="text-sm">
													並び替え
												</TabsTrigger>
											)}
											{showFilter && (
												<TabsTrigger value="filter" className="text-sm">
													絞り込み
												</TabsTrigger>
											)}
										</TabsList>

										{/* 検索オプション */}
										{showSearch && (
											<TabsContent value="search" className="mt-0">
												<div className="p-4 space-y-4">
													<RadioGroup
														value={searchField}
														onValueChange={(value) => {
															setSearchField(value);
															setGlobalFilter("");
														}}
														className="space-y-3"
													>
														{searchOptions.map((option) => (
															<div
																key={option.value}
																className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
															>
																<RadioGroupItem
																	value={option.value}
																	id={`search-${option.value}`}
																/>
																<Label
																	htmlFor={`search-${option.value}`}
																	className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
																>
																	{option.icon}
																	<div className="flex flex-col">
																		<span>{option.label}</span>
																		{option.description && (
																			<span className="text-xs text-muted-foreground">
																				{option.description}
																			</span>
																		)}
																	</div>
																</Label>
															</div>
														))}
													</RadioGroup>
												</div>
											</TabsContent>
										)}

										{/* 並び替えオプション */}
										{showSort && (
											<TabsContent value="sort" className="mt-0">
												<div className="p-4 space-y-4">
													<RadioGroup
														value={
															table.getState().sorting[0]
																? `${table.getState().sorting[0].id}_${
																		table.getState().sorting[0].desc
																			? "desc"
																			: "asc"
																	}`
																: "default"
														}
														onValueChange={(value) => {
															if (value === "default") {
																table.resetSorting();
																return;
															}
															const [field, direction] = value.split("_");
															table.setSorting([
																{
																	id: field,
																	desc: direction === "desc",
																},
															]);
														}}
														className="space-y-3"
													>
														<div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
															<RadioGroupItem
																value="default"
																id="sort-default"
															/>
															<Label
																htmlFor="sort-default"
																className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
															>
																<ArrowDownAZ className="h-4 w-4" />
																<div className="flex flex-col">
																	<span>デフォルト</span>
																</div>
															</Label>
														</div>
														{sortOptions.map((option) => (
															<div
																key={option.value}
																className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
															>
																<RadioGroupItem
																	value={option.value}
																	id={`sort-${option.value}`}
																/>
																<Label
																	htmlFor={`sort-${option.value}`}
																	className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
																>
																	{option.icon ||
																		(option.value.includes("desc") ? (
																			<ArrowDownAZ className="h-4 w-4" />
																		) : (
																			<ArrowUpAZ className="h-4 w-4" />
																		))}
																	<div className="flex flex-col">
																		<span>{option.label}</span>
																		{option.description && (
																			<span className="text-xs text-muted-foreground">
																				{option.description}
																			</span>
																		)}
																	</div>
																</Label>
															</div>
														))}
													</RadioGroup>
												</div>
											</TabsContent>
										)}

										{/* フィルターオプション */}
										{showFilter && filterColumn && (
											<TabsContent value="filter" className="mt-0">
												<div className="p-4 space-y-4">
													<RadioGroup
														value={
															(table
																.getColumn(filterColumn)
																?.getFilterValue() as string) ?? "all"
														}
														onValueChange={(value) =>
															table
																.getColumn(filterColumn)
																?.setFilterValue(value === "all" ? "" : value)
														}
														className="space-y-3"
													>
														<div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
															<RadioGroupItem value="all" id="filter-all" />
															<Label
																htmlFor="filter-all"
																className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
															>
																<Filter className="h-4 w-4" />
																<div className="flex flex-col">
																	<span>すべて</span>
																</div>
															</Label>
														</div>
														{filterOptions.map((option) => (
															<div
																key={option.value}
																className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
															>
																<RadioGroupItem
																	value={option.value}
																	id={`filter-${option.value}`}
																/>
																<Label
																	htmlFor={`filter-${option.value}`}
																	className="flex items-center gap-2 font-normal flex-1 cursor-pointer"
																>
																	{option.icon || (
																		<Filter className="h-4 w-4" />
																	)}
																	<div className="flex flex-col">
																		<span>{option.label}</span>
																		{option.description && (
																			<span className="text-xs text-muted-foreground">
																				{option.description}
																			</span>
																		)}
																	</div>
																</Label>
															</div>
														))}
													</RadioGroup>
												</div>
											</TabsContent>
										)}
									</Tabs>
								</div>
							</DrawerContent>
						</Drawer>
					</div>
				</div>
			</div>
		</div>
	);
}
