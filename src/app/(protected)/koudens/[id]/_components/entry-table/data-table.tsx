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

const columnLabels: Record<string, string> = {
	select: "選択",
	name: "ご芳名",
	organization: "団体名",
	position: "役職",
	amount: "金額",
	postal_code: "郵便番号",
	address: "住所",
	phone_number: "電話番号",
	relationship: "ご関係",
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
	has_offering: "w-[100px]",
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
	onAddRow?: (data: EditKoudenEntryFormData) => Promise<void>;
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

export function DataTable({
	data,
	columns,
	onAddRow,
	onDeleteRows,
	koudenId,
}: DataTableProps) {
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
		React.useState<VisibilityState>({
			position: false,
			phone_number: false,
			attendance_type: false,
			is_return_completed: false,
			created_at: false,
		});
	const [rowSelection, setRowSelection] = React.useState({});
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	// 検索方法の状態を追加
	const [searchMethod, setSearchMethod] = React.useState<string>("name");

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
			<div className="flex items-center justify-between">
				<div className="flex flex-wrap items-center gap-2">
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
							className="w-[200px]"
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="ml-auto">
								表示列
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
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
					<Select
						value={
							sorting[0]?.id && sorting[0]?.desc !== undefined
								? `${sorting[0].id}_${sorting[0].desc ? "desc" : "asc"}`
								: "created_at_desc"
						}
						onValueChange={handleSortChange}
					>
						<SelectTrigger className="w-[180px]">
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
				{onAddRow && (
					<EntryDialog
						open={isDialogOpen}
						onOpenChange={setIsDialogOpen}
						onSave={onAddRow}
						koudenId={koudenId}
						trigger={
							<Button className="flex items-center gap-2">
								<Plus className="h-4 w-4" />
								<span>新規追加</span>
							</Button>
						}
					/>
				)}
			</div>
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
												} whitespace-nowrap`}
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
									table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className={`border-r last:border-r-0 ${
														columnWidths[cell.column.id] || ""
													}`}
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
