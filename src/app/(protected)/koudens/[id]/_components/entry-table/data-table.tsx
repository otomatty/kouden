"use client";

import * as React from "react";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { EntryDialog } from "./entry-dialog";
import type { KoudenEntryTableData, EditKoudenEntryFormData } from "./types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import { GuideCard } from "@/components/custom/guide-card";

const columnLabels: Record<string, string> = {
	select: "選択",
	name: "ご芳名",
	organization: "団体名",
	position: "役職",
	created_at: "登録日時",
	relationship_id: "ご関係",
	amount: "金額",
	postal_code: "郵便番号",
	address: "住所",
	phone_number: "電話番号",
	attendance_type: "参列",
	has_offering: "供物",
	is_return_completed: "返礼",
	notes: "備考",
	actions: "アクション",
};

const columnWidths: Record<string, string> = {
	select: "w-[50px]",
	name: "w-[180px]",
	organization: "w-[180px]",
	position: "w-[120px]",
	amount: "w-[120px]",
	postal_code: "w-[120px]",
	address: "w-[250px]",
	phone_number: "w-[150px]",
	relationship: "w-[120px]",
	attendance_type: "w-[100px]",
	has_offering: "w-[120px]",
	is_return_completed: "w-[100px]",
	notes: "w-[200px]",
	actions: "w-[100px]",
};

type EditableFields = keyof Pick<
	KoudenEntryTableData,
	| "name"
	| "organization"
	| "position"
	| "amount"
	| "postal_code"
	| "address"
	| "phone_number"
	| "attendance_type"
	| "has_offering"
	| "is_return_completed"
	| "notes"
>;

interface DataTableProps {
	columns: ColumnDef<KoudenEntryTableData>[];
	data: KoudenEntryTableData[];
	onAddRow?: (data: EditKoudenEntryFormData) => Promise<KoudenEntryTableData>;
	onDeleteRows?: (ids: string[]) => void;
	koudenId: string;
}

// ソートオプションの定義
const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "amount_desc", label: "金額が高い順" },
	{ value: "amount_asc", label: "金額が低い順" },
	{ value: "name_asc", label: "名前順" },
] as const;

// 検索オプションの定義を追加
const searchOptions = [
	{ value: "name", label: "ご芳名" },
	{ value: "address", label: "住所" },
	{ value: "organization", label: "団体名" },
	{ value: "position", label: "役職" },
] as const;

// 画面サイズに応じた列の表示設定
const defaultColumnVisibility = {
	position: false,
	phone_number: false,
	attendance_type: false,
	is_return_completed: false,
	created_at: false,
};

const tabletColumnVisibility = {
	...defaultColumnVisibility,
	organization: false,
	postal_code: false,
	address: false,
	notes: false,
};

export function DataTable({
	data,
	columns,
	onAddRow,
	onDeleteRows,
	koudenId,
}: DataTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "created_at",
			desc: true,
		},
	]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	const [rowSelection, setRowSelection] = React.useState({});
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	// 検索方法の状態を追加
	const [searchMethod, setSearchMethod] = React.useState<string>("name");

	// 画面サイズが変更された時に列の表示状態を更新
	React.useEffect(() => {
		setColumnVisibility(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	}, [isTablet]);

	// 検索値をリセットする関数
	const resetSearchValue = React.useCallback(() => {
		for (const option of searchOptions) {
			table.getColumn(option.value)?.setFilterValue("");
		}
	}, []);

	// 検索方法が変更されたときの処理
	const handleSearchMethodChange = React.useCallback(
		(value: string) => {
			resetSearchValue();
			setSearchMethod(value);
		},
		[resetSearchValue],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	// 選択された行のIDを取得
	const selectedRows = React.useMemo(() => {
		const rows = table.getFilteredSelectedRowModel().rows;
		return rows.map((row) => row.original.id);
	}, [table.getFilteredSelectedRowModel]);

	// ソート選択の処理
	const handleSortChange = (value: string) => {
		const [field, direction] = value.split("_");
		// created_atの特別処理
		const sortField = field === "created" ? "created_at" : field;

		setSorting([
			{
				id: sortField,
				desc: direction === "desc",
			},
		]);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col lg:flex-row gap-4">
				{/* 検索セクション */}
				<GuideCard
					content={
						<div className="space-y-4">
							<div>
								<h4 className="text-lg font-semibold mb-2">検索機能</h4>
								<p className="text-sm text-muted-foreground">
									香典帳の記録を素早く見つけるための検索機能です。
								</p>
							</div>
							<div className="space-y-2">
								<h5 className="text-sm font-medium">検索方法</h5>
								<div className="grid grid-cols-2 gap-2">
									<div className="space-y-1 p-2 rounded-lg bg-muted/50">
										<p className="font-medium text-sm">ご芳名検索</p>
										<p className="text-xs text-muted-foreground">
											参列者のお名前から記録を検索
										</p>
									</div>
									<div className="space-y-1 p-2 rounded-lg bg-muted/50">
										<p className="font-medium text-sm">住所検索</p>
										<p className="text-xs text-muted-foreground">
											住所情報から記録を検索
										</p>
									</div>
									<div className="space-y-1 p-2 rounded-lg bg-muted/50">
										<p className="font-medium text-sm">団体名検索</p>
										<p className="text-xs text-muted-foreground">
											所属団体から記録を検索
										</p>
									</div>
									<div className="space-y-1 p-2 rounded-lg bg-muted/50">
										<p className="font-medium text-sm">役職検索</p>
										<p className="text-xs text-muted-foreground">
											役職名から記録を検索
										</p>
									</div>
								</div>
							</div>
						</div>
					}
				>
					<div className="border rounded-lg p-4 flex-1 hover:border-primary/50 transition-colors">
						<div className="flex items-center gap-2">
							<Select
								value={searchMethod}
								onValueChange={handleSearchMethodChange}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="検索方法" />
								</SelectTrigger>
								<SelectContent>
									{searchOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Input
								placeholder={`${searchOptions.find((opt) => opt.value === searchMethod)?.label}で検索...`}
								value={
									(table.getColumn(searchMethod)?.getFilterValue() as string) ??
									""
								}
								onChange={(event) =>
									table
										.getColumn(searchMethod)
										?.setFilterValue(event.target.value)
								}
								className="flex-1 min-w-[300px]"
							/>
						</div>
					</div>
				</GuideCard>

				<div className="flex gap-4 justify-between">
					{/* 表示列とソートのセクション */}
					<div className="border rounded-lg p-4 min-w-[400px]">
						<div className="flex items-center gap-4">
							<GuideCard
								content={
									<div className="space-y-4">
										<div>
											<h4 className="text-lg font-semibold mb-2">
												表示列のカスタマイズ
											</h4>
											<p className="text-sm text-muted-foreground">
												必要な情報だけを表示して、見やすい表を作成できます。
											</p>
										</div>
										<div className="space-y-2">
											<h5 className="text-sm font-medium">主な機能</h5>
											<div className="grid gap-2">
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<p className="font-medium text-sm">基本情報の表示</p>
													<p className="text-xs text-muted-foreground">
														ご芳名、金額、ご関係など、必須の情報を表示
													</p>
												</div>
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<p className="font-medium text-sm">詳細情報の追加</p>
													<p className="text-xs text-muted-foreground">
														住所、電話番号などの追加情報を必要に応じて表示
													</p>
												</div>
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<p className="font-medium text-sm">状態管理の列</p>
													<p className="text-xs text-muted-foreground">
														参列、供物、返礼の状態を確認できる列を表示
													</p>
												</div>
											</div>
										</div>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												className="bg-transparent w-full"
											>
												表示列を選択
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
															onCheckedChange={(value) =>
																column.toggleVisibility(!!value)
															}
														>
															{columnLabels[column.id] || column.id}
														</DropdownMenuCheckboxItem>
													);
												})}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</GuideCard>

							<GuideCard
								content={
									<div className="space-y-4">
										<div>
											<h4 className="text-lg font-semibold mb-2">
												並び替え機能
											</h4>
											<p className="text-sm text-muted-foreground">
												記録を様々な条件で整理して表示できます。
											</p>
										</div>
										<div className="space-y-2">
											<h5 className="text-sm font-medium">
												並び替えオプション
											</h5>
											<div className="grid gap-2">
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<div className="flex items-center justify-between">
														<p className="font-medium text-sm">登録日時順</p>
														<p className="text-xs text-muted-foreground">
															新しい順/古い順
														</p>
													</div>
													<p className="text-xs text-muted-foreground">
														最近の記録を確認したい時に便利です
													</p>
												</div>
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<div className="flex items-center justify-between">
														<p className="font-medium text-sm">金額順</p>
														<p className="text-xs text-muted-foreground">
															高い順/低い順
														</p>
													</div>
													<p className="text-xs text-muted-foreground">
														金額の集計や確認をする時に使用します
													</p>
												</div>
												<div className="p-2 rounded-lg bg-muted/50 space-y-1">
													<div className="flex items-center justify-between">
														<p className="font-medium text-sm">名前順</p>
														<p className="text-xs text-muted-foreground">
															五十音順
														</p>
													</div>
													<p className="text-xs text-muted-foreground">
														特定の方の記録を探す時に便利です
													</p>
												</div>
											</div>
										</div>
									</div>
								}
							>
								<div className="flex-1 hover:border-primary/50 transition-colors">
									<Select
										value={
											sorting[0]?.id && sorting[0]?.desc !== undefined
												? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}`
												: "created_at_desc"
										}
										onValueChange={handleSortChange}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="並び順を選択" />
										</SelectTrigger>
										<SelectContent>
											{sortOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</GuideCard>
						</div>
					</div>
					<div className="flex items-center justify-end">
						{onAddRow && (
							<EntryDialog
								open={isDialogOpen}
								onOpenChange={setIsDialogOpen}
								onSave={onAddRow}
								koudenId={koudenId}
								trigger={
									<Button
										size="lg"
										className="text-sm font-bold flex items-center gap-2"
									>
										<Plus className="h-6 w-6" />
										<span>香典を登録する</span>
									</Button>
								}
							/>
						)}
					</div>
				</div>
			</div>

			{/* 削除ボタン */}
			<div>
				{selectedRows.length > 0 && onDeleteRows && (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => onDeleteRows(selectedRows)}
						className="flex items-center gap-2"
					>
						<Trash2 className="h-4 w-4" />
						<span>{selectedRows.length}件を削除</span>
					</Button>
				)}
			</div>

			{/* 既存のテーブル部分 */}
			<div className="rounded-md border">
				<div className="relative">
					<Table className="overflow-hidden w-full table-fixed">
						<TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead
												key={header.id}
												className={`bg-background border-r last:border-r-0 ${
													columnWidths[header.id] || ""
												} whitespace-nowrap overflow-hidden text-ellipsis`}
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
					</Table>
					<div className="max-h-[calc(100vh-16rem)] overflow-auto">
						<Table className="w-full table-fixed">
							<TableBody>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row, i) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
											className={i % 2 === 0 ? "bg-background" : undefined}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className={`border-r last:border-r-0 ${
														columnWidths[cell.column.id] || ""
													} overflow-hidden text-ellipsis`}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center"
										>
											データがありません
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} /{" "}
					{table.getFilteredRowModel().rows.length} 行を選択中
				</div>
			</div>
		</div>
	);
}
