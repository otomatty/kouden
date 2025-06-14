"use client";
// library
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
import { useAtomValue } from "jotai";
import { useState, useCallback, useEffect, useMemo } from "react";

// ui
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
// types
import type { Offering, OfferingWithKoudenEntries } from "@/types/offerings";
import type { Entry } from "@/types/entries";
import type { CellValue } from "@/types/table";
// Server Actions
import { deleteOffering, updateOfferingField } from "@/app/_actions/offerings";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// stores
import { permissionAtom } from "@/store/permission";
// components
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { OfferingDialog } from "../dialog/offering-dialog";
import { createColumns } from "./columns";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./constants";

interface DataTableProps {
	koudenId: string;
	entries: Entry[];
	offerings: OfferingWithKoudenEntries[];
	onDataChange?: (offerings: OfferingWithKoudenEntries[]) => void;
}

export function DataTable({ koudenId, entries, offerings, onDataChange }: DataTableProps) {
	const permission = useAtomValue(permissionAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");

	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); //列フィルター
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		isMobile ? tabletColumnVisibility : defaultColumnVisibility,
	); //列表示
	const [rowSelection, setRowSelection] = useState({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [, setSelectedRows] = useState<string[]>([]);

	// 画面サイズが変更された時に列の表示状態を更新
	useEffect(() => {
		setColumnVisibility(isMobile ? tabletColumnVisibility : defaultColumnVisibility);
	}, [isMobile]);

	// 選択された行のIDを取得
	const selectedRowsIds = useMemo(() => {
		return Object.keys(rowSelection);
	}, [rowSelection]);

	// 選択された行を削除
	const handleDeleteRows = useCallback(
		async (ids: string[]) => {
			try {
				await Promise.all(ids.map((id) => deleteOffering(id, koudenId)));
				setSelectedRows([]);
				if (onDataChange) {
					onDataChange(offerings.filter((offering) => !ids.includes(offering.id)));
				}
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("[handleDeleteRows] Delete failed:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[koudenId, offerings, onDataChange],
	);

	// セルの編集
	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, value: CellValue) => {
			// インデックスからエントリーを取得
			const offeringIndex = Number.parseInt(rowId, 10);
			if (Number.isNaN(offeringIndex) || offeringIndex < 0 || offeringIndex >= offerings.length) {
				toast({
					title: "エラーが発生しました",
					description: "無効な行インデックスです",
					variant: "destructive",
				});
				return;
			}

			const targetOffering = offerings[offeringIndex];
			if (!targetOffering) {
				toast({
					title: "エラーが発生しました",
					description: "対象のお供え物が見つかりませんでした",
					variant: "destructive",
				});
				return;
			}

			try {
				const updatedOffering = await updateOfferingField(
					targetOffering.id,
					columnId as keyof Omit<Offering, "offering_entries">,
					value,
				);

				if (onDataChange) {
					const newOfferings = offerings.map((offering) =>
						offering.id === targetOffering.id ? { ...offering, ...updatedOffering } : offering,
					);
					onDataChange(newOfferings);
				}

				toast({
					title: "更新完了",
					description: "データを更新しました",
				});
			} catch (error) {
				console.error("[handleCellEdit] Update failed:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[offerings, onDataChange],
	);

	// カラムの生成
	const columns = useMemo(
		() =>
			createColumns({
				onDeleteRows: handleDeleteRows,
				selectedRows: selectedRowsIds,
				permission,
				koudenId,
				entries,
			}),
		[handleDeleteRows, selectedRowsIds, permission, koudenId, entries],
	);

	const table = useReactTable({
		data: offerings,
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
			const searchableColumns = ["providerName", "description", "type"];

			// 各カラムのマッチング結果を収集
			const matchResults = searchableColumns.map((columnId) => {
				const value = row.getValue(columnId);
				const matches = value != null && String(value).toLowerCase().includes(searchValue);
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
					{!isMobile && <OfferingDialog koudenId={koudenId} entries={entries} variant="create" />}
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
				permission={permission}
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
				onCellEdit={handleCellEdit}
				emptyMessage="お供え物が登録されていません"
			/>

			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{selectedRowsIds.length} / {table.getFilteredRowModel().rows.length} 行を選択中
				</div>
			</div>
		</div>
	);
}
