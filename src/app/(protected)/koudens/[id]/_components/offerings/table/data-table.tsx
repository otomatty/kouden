"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
} from "@tanstack/react-table";
import type { Offering } from "@/types/offering";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { Button } from "@/components/ui/button";
import { Trash2, LayoutGrid, Table2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CellValue } from "@/components/custom/data-table/types";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	filterOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./columns";
import type { KoudenPermission } from "@/types/role";
import { OfferingDialog } from "../dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { OfferingCardList } from "../card-list/offering-card-list";

interface DataTableProps {
	columns: ColumnDef<Offering, string | number | boolean | null>[];
	data: Offering[];
	permission?: KoudenPermission;
	koudenId: string;
	koudenEntries: KoudenEntry[];
	onUpdate?: (id: string, data: Partial<Offering>) => Promise<void>;
	onDelete?: (ids: string[]) => Promise<void>;
}

export function DataTable({
	columns,
	data,
	permission,
	koudenId,
	koudenEntries,
	onUpdate,
	onDelete,
}: DataTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const [viewMode, setViewMode] = useLocalStorage<"table" | "grid">(
		"offering-view-mode",
		isTablet ? "grid" : "table",
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");

	// 画面サイズが変更された時に列の表示状態を更新
	React.useEffect(() => {
		setColumnVisibility(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	}, [isTablet]);

	// モバイルの場合は強制的にグリッド表示
	React.useEffect(() => {
		if (isTablet && viewMode !== "grid") {
			setViewMode("grid");
		}
	}, [isTablet, viewMode, setViewMode]);

	// 選択された行のIDを取得
	const selectedRows = React.useMemo(() => {
		return Object.keys(rowSelection);
	}, [rowSelection]);

	// 選択された行を削除
	const handleDeleteRows = React.useCallback(
		async (ids: string[]) => {
			try {
				await onDelete?.(ids);
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
				setRowSelection({});
			} catch (error) {
				console.error("Failed to delete offerings:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[onDelete],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		enableGlobalFilter: true,
		globalFilterFn: (row, _columnId, filterValue) => {
			if (!filterValue) return true;

			const searchValue = String(filterValue).toLowerCase();
			const searchableColumns = ["provider_name", "description"];

			// 各カラムのマッチング結果を収集
			const matchResults = searchableColumns.map((columnId) => {
				const value = row.getValue(columnId);
				const matches =
					value != null && String(value).toLowerCase().includes(searchValue);
				return { columnId, value: value ?? "null", matches };
			});

			// いずれかのカラムがマッチした場合、その行の情報を表示
			const hasMatch = matchResults.some((result) => result.matches);

			return hasMatch;
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
		},
	});

	const handleCellEdit = async (
		columnId: string,
		rowId: string,
		value: CellValue,
	) => {
		try {
			let targetRow: Offering | undefined;
			if (/^\d+$/.test(rowId)) {
				const index = Number.parseInt(rowId, 10);
				targetRow = data[index];
			} else {
				targetRow = data.find((row) => row.id === rowId);
			}

			if (!targetRow) {
				throw new Error("編集対象の行が見つかりません");
			}

			// 値の型変換
			let convertedValue: string | number | undefined;

			if (columnId === "type") {
				convertedValue = value as string;
			} else if (columnId === "price" || columnId === "quantity") {
				convertedValue =
					value === "" || value === null ? undefined : Number(value);
			} else {
				convertedValue =
					value === "" || value === null ? undefined : String(value);
			}

			await onUpdate?.(targetRow.id, {
				[columnId]: convertedValue,
			});
		} catch (error) {
			toast({
				title: "エラーが発生しました",
				description:
					error instanceof Error ? error.message : "データの更新に失敗しました",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				searchOptions={searchOptions}
				filterColumn="type"
				filterOptions={filterOptions}
				sortOptions={sortOptions}
				columnLabels={columnLabels}
				showViewToggle={!isTablet}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			>
				<div className="flex items-center gap-4">
					{!isTablet && (
						<OfferingDialog koudenId={koudenId} koudenEntries={koudenEntries} />
					)}
				</div>
			</DataTableToolbar>

			{/* 削除ボタン */}
			{selectedRows.length > 0 && (
				<Button
					variant="destructive"
					size="sm"
					onClick={() => handleDeleteRows(selectedRows)}
					className="flex items-center gap-2"
				>
					<Trash2 className="h-4 w-4" />
					<span>{selectedRows.length}件を削除</span>
				</Button>
			)}

			{viewMode === "table" && !isTablet ? (
				<BaseDataTable
					columns={columns}
					data={table.getFilteredRowModel().rows.map((row) => row.original)}
					editableColumns={editableColumns}
					onCellEdit={handleCellEdit}
					sorting={sorting}
					onSortingChange={setSorting}
					columnFilters={columnFilters}
					onColumnFiltersChange={setColumnFilters}
					columnVisibility={columnVisibility}
					onColumnVisibilityChange={setColumnVisibility}
					rowSelection={rowSelection}
					onRowSelectionChange={setRowSelection}
					emptyMessage="お供え物が登録されていません"
				/>
			) : (
				<OfferingCardList
					offerings={data}
					onDelete={() => setRowSelection({})}
				/>
			)}

			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{selectedRows.length} / {table.getFilteredRowModel().rows.length}{" "}
					行を選択中
				</div>
			</div>
		</div>
	);
}
