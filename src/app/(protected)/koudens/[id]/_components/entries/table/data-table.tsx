"use client";
// ライブラリ
import * as React from "react";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// UIコンポーネント/アイコン
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
// 型定義
import type { KoudenEntry } from "@/types/kouden";
import type { Database } from "@/types/supabase";
// Server Actions
import { getRelationships } from "@/app/_actions/relationships";
import {
	deleteKoudenEntries,
	updateKoudenEntryField,
} from "@/app/_actions/kouden-entries";
// フック
import { useMediaQuery } from "@/hooks/use-media-query";
// コンポーネント
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { EntryDialog } from "../dialog/entry-dialog";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
	createColumns,
} from "./columns";

// 型定義の追加
type CellValue = string | number | boolean | null;

interface DataTableProps {
	koudenId: string;
	entries: KoudenEntry[];
	onDataChange?: (entries: KoudenEntry[]) => void;
}

export function DataTable({ koudenId, entries, onDataChange }: DataTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
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
	const [selectedRows, setSelectedRows] = useState<string[]>([]);

	// 画面サイズが変更された時に列の表示状態を更新
	React.useEffect(() => {
		setColumnVisibility(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	}, [isTablet]);

	// 選択された行のIDを取得
	const selectedRowsIds = React.useMemo(() => {
		return Object.keys(rowSelection);
	}, [rowSelection]);

	// 選択された行を削除
	const handleDeleteRows = React.useCallback(
		async (ids: string[]) => {
			try {
				await deleteKoudenEntries(ids, koudenId);
				setSelectedRows([]);
				if (onDataChange) {
					onDataChange(entries.filter((entry) => !ids.includes(entry.id)));
				}
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[koudenId, entries, onDataChange],
	);

	// 関係性データの取得
	const { data: relationships = [], isLoading: isLoadingRelationships } =
		useQuery({
			queryKey: ["relationships", koudenId],
			queryFn: async () => {
				const data = await getRelationships(koudenId);
				return data.map((rel) => ({
					id: rel.id,
					name: rel.name,
					description: rel.description || undefined,
				}));
			},
		});

	// セルの更新
	const handleCellUpdate = React.useCallback(
		async (
			id: string,
			field: keyof Omit<KoudenEntry, "relationship">,
			value: CellValue,
		) => {
			try {
				const updatedEntry = (await updateKoudenEntryField(
					id,
					field,
					value,
				)) as KoudenEntry;
				if (onDataChange) {
					onDataChange(
						entries.map((entry) =>
							entry.id === id ? { ...entry, ...updatedEntry } : entry,
						),
					);
				}
				toast({
					title: "更新完了",
					description: "データを更新しました",
				});
			} catch (error) {
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[entries, onDataChange],
	);

	const columns = React.useMemo(
		() =>
			createColumns({
				onEditRow: (entry: KoudenEntry) => {
					// TODO: 編集ダイアログを開く処理は別途実装
				},
				onDeleteRows: handleDeleteRows,
				onCellUpdate: handleCellUpdate,
				selectedRows: selectedRowsIds,
				relationships,
				koudenId,
				isLoadingRelationships,
			}),
		[
			handleDeleteRows,
			handleCellUpdate,
			selectedRowsIds,
			relationships,
			koudenId,
			isLoadingRelationships,
		],
	);

	const table = useReactTable({
		data: entries,
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
			const searchableColumns = ["name", "address", "organization", "position"];

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

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				searchOptions={searchOptions}
				sortOptions={sortOptions}
				columnLabels={columnLabels}
			>
				<div className="flex items-center justify-end">
					<EntryDialog koudenId={koudenId} variant="create" />
				</div>
			</DataTableToolbar>

			{/* 削除ボタン */}
			{selectedRowsIds.length > 0 && (
				<Button
					variant="destructive"
					size="sm"
					onClick={() => handleDeleteRows(selectedRowsIds)}
					className="flex items-center gap-2"
				>
					<Trash2 className="h-4 w-4" />
					<span>{selectedRowsIds.length}件を削除</span>
				</Button>
			)}

			<BaseDataTable
				columns={columns}
				data={table.getFilteredRowModel().rows.map((row) => row.original)}
				editableColumns={editableColumns}
				sorting={sorting}
				onSortingChange={setSorting}
				columnFilters={columnFilters}
				onColumnFiltersChange={setColumnFilters}
				columnVisibility={columnVisibility}
				onColumnVisibilityChange={setColumnVisibility}
				rowSelection={rowSelection}
				onRowSelectionChange={setRowSelection}
				emptyMessage="香典の記録がありません"
			/>

			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{selectedRowsIds.length} / {table.getFilteredRowModel().rows.length}{" "}
					行を選択中
				</div>
			</div>
		</div>
	);
}
