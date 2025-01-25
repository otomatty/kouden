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
import type { KoudenEntryTableData } from "../types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useKoudenEntries } from "@/hooks/useKoudenEntries";
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { AddEntryButton } from "../dialog/add-entry-button";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CellValue } from "@/components/custom/data-table/types";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";

interface DataTableProps {
	columns: ColumnDef<KoudenEntryTableData, string | number | boolean | null>[];
	koudenId: string;
}

export function DataTable({ columns, koudenId }: DataTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const {
		entries: data = [],
		deleteEntry,
		updateEntry,
	} = useKoudenEntries(koudenId);
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

	// 選択された行のIDを取得
	const selectedRows = React.useMemo(() => {
		return Object.keys(rowSelection);
	}, [rowSelection]);

	// 選択された行を削除
	const handleDeleteRows = React.useCallback(
		async (ids: string[]) => {
			try {
				await Promise.all(ids.map((id) => deleteEntry(id)));
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
				setRowSelection({});
			} catch (error) {
				console.error("Failed to delete entries:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[deleteEntry],
	);

	// 関係性データの取得
	const { data: relationships = [] } = useQuery({
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

	// 編集可能なカラムの設定を動的に更新
	const dynamicEditableColumns = React.useMemo(() => {
		return {
			...editableColumns,
			relationship_id: {
				...editableColumns.relationship_id,
				options: relationships.map((rel) => ({
					value: rel.id,
					label: rel.name,
				})),
			},
		};
	}, [relationships]);

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
			if (hasMatch) {
				console.log("Matched Row:", {
					searchValue,
					rowData: Object.fromEntries(
						searchableColumns.map((columnId) => [
							columnId,
							row.getValue(columnId) ?? "null",
						]),
					),
					matches: matchResults,
				});
			}

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
			// rowIdが数値文字列の場合、インデックスとして扱う
			let targetRow: KoudenEntryTableData | undefined;
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
			let convertedValue: string | number | boolean | null = value;

			// boolean型の処理
			if (columnId === "has_offering" || columnId === "is_return_completed") {
				if (typeof value === "boolean") {
					convertedValue = value;
				} else {
					convertedValue = value === "true";
				}
			}

			// 数値型の処理
			if (columnId === "amount") {
				convertedValue = value === "" ? null : Number(value);
			}

			// 空文字列をnullに変換
			if (value === "") {
				convertedValue = null;
			}

			await updateEntry({
				id: targetRow.id,
				data: {
					[columnId]: convertedValue,
				},
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
				sortOptions={sortOptions}
				columnLabels={columnLabels}
			>
				<div className="flex items-center justify-end">
					<AddEntryButton koudenId={koudenId} />
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

			<BaseDataTable
				columns={columns}
				data={table.getFilteredRowModel().rows.map((row) => row.original)}
				editableColumns={dynamicEditableColumns}
				onCellEdit={handleCellEdit}
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
					{selectedRows.length} / {table.getFilteredRowModel().rows.length}{" "}
					行を選択中
				</div>
			</div>
		</div>
	);
}
