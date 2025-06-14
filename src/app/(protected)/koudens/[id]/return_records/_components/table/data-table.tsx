"use client";

// library
import { useState, useMemo, useCallback, useEffect } from "react";
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

// ui
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// types
import type {
	ReturnManagementSummary,
	BulkUpdateConfig,
} from "@/types/return-records/return-records";
import type { Relationship } from "@/types/relationships";
import type { Entry } from "@/types/entries";
import type { CellValue } from "@/types/table";

// Server Actions
import {
	deleteReturnRecords,
	updateReturnRecordFieldByKoudenEntryId,
	bulkUpdateReturnRecords,
} from "@/app/_actions/return-records/return-records";

// hooks
import { useMediaQuery } from "@/hooks/use-media-query";

// stores
import { permissionAtom } from "@/store/permission";

// components
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { TableSkeleton } from "@/components/custom/loading/skeletons";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { ReturnItemsButton } from "../return-items-button";
import { BulkUpdateTableDialog } from "../dialog/bulk-update-table";
import { createColumns } from "./columns";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./constants";

// Props
interface DataTableProps {
	koudenId: string;
	entries: Entry[];
	returns: ReturnManagementSummary[];
	relationships: Relationship[];
	onDataChange: () => void;
	onOptimisticUpdate?: <K extends keyof ReturnManagementSummary>(
		id: string,
		field: K,
		newValue: ReturnManagementSummary[K],
		updateFn: () => Promise<void>,
	) => Promise<void>;
	searchValue: string;
	onSearchChange: (value: string) => void;
	statusFilter: string;
	onStatusFilterChange: (value: string) => void;
	hasMore: boolean;
	isLoading: boolean;
	lastElementRef: (node: HTMLElement | null) => void;
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
}

/**
 * DataTableコンポーネント
 * 役割：返礼管理のテーブル表示（BaseDataTableパターン使用）
 */
export function DataTable({
	koudenId,
	entries,
	returns,
	relationships,
	onDataChange,
	onOptimisticUpdate,
	searchValue,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	hasMore,
	isLoading,
	lastElementRef,
	onEditReturn,
}: DataTableProps) {
	const permission = useAtomValue(permissionAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isTableLoading, setIsTableLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		isMobile ? tabletColumnVisibility : defaultColumnVisibility,
	);
	const [rowSelection, setRowSelection] = useState({});
	const [_, setSelectedRows] = useState<string[]>([]);
	const { toast } = useToast();

	// データの正規化
	const normalizedReturns = useMemo(() => {
		if (!Array.isArray(returns)) {
			console.error("[ERROR] Invalid returns data:", returns);
			return [];
		}
		return returns.filter(
			(returnRecord): returnRecord is ReturnManagementSummary =>
				returnRecord !== null && returnRecord !== undefined,
		);
	}, [returns]);

	// 関係性データの正規化
	const normalizedRelationships = useMemo(() => {
		if (!Array.isArray(relationships)) {
			console.error("[ERROR] Invalid relationships data:", relationships);
			return [];
		}
		return relationships;
	}, [relationships]);

	// データの検証とエラーハンドリング
	useEffect(() => {
		try {
			setIsTableLoading(true);

			if (!Array.isArray(normalizedReturns)) {
				throw new Error("Invalid returns data in DataTable");
			}
			if (!Array.isArray(normalizedRelationships)) {
				throw new Error("Invalid relationships data in DataTable");
			}

			setError(null);
		} catch (err) {
			console.error("[ERROR] DataTable initialization failed:", err);
			setError(err instanceof Error ? err : new Error("Unknown error"));
		} finally {
			setIsTableLoading(false);
		}
	}, [normalizedReturns, normalizedRelationships]);

	// セル編集ハンドラー（楽観的更新対応）
	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, newValue: CellValue) => {
			// フロントエンドのcolumnIdをデータベースのフィールド名に変換
			const fieldNameMapping: Record<string, string> = {
				returnStatus: "return_status",
				funeralGiftAmount: "funeral_gift_amount",
				additionalReturnAmount: "additional_return_amount",
				returnMethod: "return_method",
				arrangementDate: "arrangement_date",
				remarks: "remarks",
				shippingPostalCode: "shipping_postal_code",
				shippingAddress: "shipping_address",
				shippingPhoneNumber: "shipping_phone_number",
				returnItemsCost: "return_items_cost",
			};

			const dbFieldName = fieldNameMapping[columnId] || columnId;

			// 楽観的更新が利用可能な場合は使用、そうでなければ従来の方法
			if (onOptimisticUpdate) {
				try {
					await onOptimisticUpdate(
						rowId,
						columnId as keyof ReturnManagementSummary,
						newValue as ReturnManagementSummary[keyof ReturnManagementSummary],
						async () => {
							await updateReturnRecordFieldByKoudenEntryId(rowId, dbFieldName, newValue);
						},
					);

					toast({
						title: "更新完了",
						description: `${columnLabels[columnId] || columnId}を更新しました`,
					});
				} catch (error) {
					console.error("[ERROR] Optimistic cell edit failed:", error);
					toast({
						title: "更新エラー",
						description: "データの更新に失敗しました",
						variant: "destructive",
					});
				}
			} else {
				// フォールバック：従来の方法
				try {
					await updateReturnRecordFieldByKoudenEntryId(rowId, dbFieldName, newValue);
					onDataChange();
					toast({
						title: "更新完了",
						description: `${columnLabels[columnId] || columnId}を更新しました`,
					});
				} catch (error) {
					console.error("[ERROR] Cell edit failed:", error);
					toast({
						title: "更新エラー",
						description: "データの更新に失敗しました",
						variant: "destructive",
					});
				}
			}
		},
		[onOptimisticUpdate, onDataChange, toast],
	);

	// 行削除ハンドラー
	const handleDeleteRows = useCallback(
		async (rowIds: string[]) => {
			try {
				await deleteReturnRecords(rowIds);
				onDataChange();
				setRowSelection({});
				setSelectedRows([]);
				toast({
					title: "削除完了",
					description: `${rowIds.length}件の返礼記録を削除しました`,
				});
			} catch (error) {
				console.error("[ERROR] Row deletion failed:", error);
				toast({
					title: "削除エラー",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[onDataChange, toast],
	);

	// カラム定義の生成
	const columns = useMemo(
		() =>
			createColumns({
				koudenId,
				entries,
				relationships: normalizedRelationships,
				onDeleteRows: handleDeleteRows,
				onEditReturn,
				permission,
			}),
		[koudenId, entries, normalizedRelationships, handleDeleteRows, onEditReturn, permission],
	);

	// テーブルインスタンスの作成
	const table = useReactTable({
		data: normalizedReturns,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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

	// 選択行の更新
	useEffect(() => {
		const selectedRowIds = Object.keys(rowSelection).filter(
			(key) => rowSelection[key as keyof typeof rowSelection],
		);
		setSelectedRows(selectedRowIds);
	}, [rowSelection]);

	// レスポンシブ対応
	useEffect(() => {
		setColumnVisibility(isMobile ? tabletColumnVisibility : defaultColumnVisibility);
	}, [isMobile]);

	// エラー表示
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<p className="text-destructive mb-4">テーブルの初期化に失敗しました</p>
				<p className="text-sm text-muted-foreground mb-4">{error.message}</p>
				<Button onClick={() => window.location.reload()} variant="outline">
					ページを再読み込み
				</Button>
			</div>
		);
	}

	// ローディング表示
	if (isTableLoading) {
		return <TableSkeleton />;
	}

	return (
		<div className="w-full space-y-4">
			{/* ツールバー */}
			<DataTableToolbar
				table={table}
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				searchOptions={searchOptions}
				sortValue={statusFilter !== "all" ? statusFilter : undefined}
				onSortChange={onStatusFilterChange}
				sortOptions={sortOptions}
				columnLabels={columnLabels}
				showDateFilter={false}
			>
				{/* 返礼品管理ボタンと一括変更ボタン */}
				<div className="flex items-center justify-end gap-2">
					<BulkUpdateTableDialog koudenId={koudenId} onBulkUpdate={async () => onDataChange()} />
					<ReturnItemsButton koudenId={koudenId} />
				</div>
			</DataTableToolbar>

			{/* データテーブル */}
			<BaseDataTable
				columns={columns}
				data={normalizedReturns}
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
				emptyMessage="返礼記録がありません"
				permission={permission}
			/>

			{/* 無限スクロール用の要素 */}
			<div ref={lastElementRef} className="h-1" />

			{/* ローディング表示 */}
			{isLoading && (
				<div className="flex justify-center py-4">
					<div className="flex items-center space-x-2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
						<span className="text-sm text-muted-foreground">読み込み中...</span>
					</div>
				</div>
			)}

			{/* 追加データなしの表示 */}
			{!hasMore && normalizedReturns.length > 0 && (
				<div className="text-center py-4">
					<span className="text-sm text-muted-foreground">全ての返礼記録を表示しました</span>
				</div>
			)}
		</div>
	);
}
