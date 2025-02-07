"use client";

import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
	type ColumnDef,
} from "@tanstack/react-table";
import { useAtomValue } from "jotai";

// ui
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// types
import type { ReturnRecord, ReturnRecordResponse } from "@/types/return-records";
import type { CellValue } from "@/types/table";
import type { DeliveryMethod } from "@/types/delivery-methods";
import type { ReturnItemMaster } from "@/types/return-records/return-item-masters";

// Server Actions
import { deleteReturnRecords, updateReturnRecordField } from "@/app/_actions/return-records";

// hooks
import { useMediaQuery } from "@/hooks/use-media-query";

// stores
import { permissionAtom } from "@/store/permission";

// components
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { ReturnRecordDialog } from "../dialog/return-record-dialog";
import { createColumns } from "./columns";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./constants";

interface ReturnRecordTableProps {
	koudenId: string;
	returnRecords: ReturnRecord[];
	onDataChange: (data: ReturnRecord[]) => void;
	deliveryMethods: DeliveryMethod[];
	returnItemMasters: ReturnItemMaster[];
	koudenEntryId: string;
}

export function ReturnRecordTable({
	koudenId,
	returnRecords = [],
	onDataChange,
	deliveryMethods,
	returnItemMasters,
}: ReturnRecordTableProps) {
	const permission = useAtomValue(permissionAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		isMobile ? tabletColumnVisibility : defaultColumnVisibility,
	);
	const [rowSelection, setRowSelection] = useState({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [, setSelectedRows] = useState<string[]>([]);
	const { toast } = useToast();

	// データの正規化
	const normalizedRecords = useMemo(() => {
		if (!Array.isArray(returnRecords)) {
			console.error("[ERROR] Invalid return records data:", returnRecords);
			return [];
		}

		return returnRecords.map((record) => ({
			...record,
			createdAt: record.created_at,
			updatedAt: record.updated_at,
			scheduledDate: record.scheduled_date,
			completedDate: record.completed_date,
			shippingFee: record.shipping_fee,
		}));
	}, [returnRecords]);

	// データの検証とエラーハンドリング
	React.useEffect(() => {
		try {
			setIsLoading(true);
			if (!Array.isArray(normalizedRecords)) {
				throw new Error("Invalid return records data");
			}
			setError(null);
		} catch (err) {
			console.error("[ERROR] Data validation failed:", err);
			setError(err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [normalizedRecords]);

	// 画面サイズが変更された時に列の表示状態を更新
	React.useEffect(() => {
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
				await deleteReturnRecords(ids, koudenId);
				setSelectedRows([]);
				if (onDataChange) {
					onDataChange(normalizedRecords.filter((record) => !ids.includes(record.id)));
				}
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("Failed to delete return records:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[koudenId, normalizedRecords, onDataChange, toast],
	);

	// セルの編集
	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, value: CellValue) => {
			const index = Number.parseInt(rowId, 10);
			const targetRecord = normalizedRecords[index];

			if (!targetRecord) {
				console.error("[ERROR] Return record not found:", {
					rowId,
					index,
					recordsCount: normalizedRecords.length,
				});
				toast({
					title: "エラーが発生しました",
					description: "対象のデータが見つかりません",
					variant: "destructive",
				});
				return;
			}

			try {
				const updatedRecord = await updateReturnRecordField(
					targetRecord.id,
					columnId as keyof ReturnRecordResponse,
					value,
				);

				if (onDataChange) {
					const newRecords = normalizedRecords.map((record) =>
						record.id === targetRecord.id ? { ...record, ...updatedRecord } : record,
					);
					onDataChange(newRecords);
				}

				toast({
					title: "更新完了",
					description: "データを更新しました",
				});
			} catch (error) {
				console.error("[ERROR] Update failed:", {
					error,
					targetRecord: {
						id: targetRecord.id,
					},
					columnId,
					value,
				});
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[normalizedRecords, onDataChange, toast],
	);

	// カラムの生成
	const columns = useMemo(
		() =>
			createColumns({
				onDeleteRows: handleDeleteRows,
				selectedRows: selectedRowsIds,
				permission,
				koudenId,
			}),
		[handleDeleteRows, selectedRowsIds, permission, koudenId],
	);

	const table = useReactTable({
		data: normalizedRecords,
		columns: columns as ColumnDef<ReturnRecord, CellValue>[],
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
			const searchableColumns = ["items", "deliveryMethod", "notes"];

			const matchResults = searchableColumns.map((columnId) => {
				const value = row.getValue(columnId);
				const matches = value != null && String(value).toLowerCase().includes(searchValue);
				return { columnId, value: value ?? "null", matches };
			});

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

	const renderContent = () => {
		if (isLoading) {
			return <div>データを読み込み中...</div>;
		}

		if (error) {
			return <div>エラーが発生しました: {error.message}</div>;
		}

		return (
			<div className="space-y-4">
				{!Array.isArray(normalizedRecords) ? (
					<div className="text-center text-muted-foreground">データの読み込みに失敗しました</div>
				) : (
					<>
						<DataTableToolbar
							table={table}
							searchOptions={searchOptions}
							sortOptions={sortOptions}
							columnLabels={columnLabels}
						>
							<div className="flex items-center justify-end">
								{!isMobile && (
									<ReturnRecordDialog
										koudenId={koudenId}
										variant="create"
										deliveryMethods={deliveryMethods}
										returnItemMasters={returnItemMasters}
									/>
								)}
							</div>
						</DataTableToolbar>

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
							columns={columns as ColumnDef<ReturnRecord, CellValue>[]}
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
							emptyMessage="返礼記録がありません"
						/>

						<div className="flex items-center justify-end space-x-2">
							<div className="flex-1 text-sm text-muted-foreground">
								{selectedRowsIds.length} / {table.getFilteredRowModel().rows.length} 行を選択中
							</div>
						</div>
					</>
				)}
			</div>
		);
	};

	return renderContent();
}
