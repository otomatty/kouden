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
import { OfferingDialog } from "../dialog/offering-dialog";
import type { KoudenEntry } from "@/types/kouden";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { OfferingCardList } from "../card-list/offering-card-list";
import { permissionAtom } from "@/store/permission";
import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { getRelationships } from "@/app/_actions/relationships";
import { createColumns } from "./columns";

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
	data,
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
	const permission = useAtomValue(permissionAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");

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
	const selectedRowsIds = React.useMemo(() => {
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

	// 編集ダイアログの状態
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [editingOffering, setEditingOffering] = React.useState<
		Offering | undefined
	>();

	// 編集ダイアログを開く
	const handleEditRow = React.useCallback((offering: Offering) => {
		setEditingOffering(offering);
		setIsEditDialogOpen(true);
	}, []);

	// 編集成功時の処理
	const handleEditSuccess = React.useCallback(() => {
		setIsEditDialogOpen(false);
		setEditingOffering(undefined);
		toast({
			title: "更新完了",
			description: "お供え物を更新しました",
		});
	}, []);

	// カラムの生成
	const columns = React.useMemo(
		() =>
			createColumns({
				onEditRow: handleEditRow,
				onDeleteRows: handleDeleteRows,
				onCellEdit: handleCellEdit,
				onCellUpdate: handleCellEdit,
				selectedRows: selectedRowsIds,
				permission,
			}),
		[handleEditRow, handleDeleteRows, selectedRowsIds, permission],
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
						<OfferingDialog
							koudenId={koudenId}
							onSuccess={handleEditSuccess}
							koudenEntries={koudenEntries}
						/>
					)}
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
					permission={permission}
				/>
			) : (
				<OfferingCardList
					offerings={data}
					onDelete={() => setRowSelection({})}
				/>
			)}

			<div className="flex items-center justify-end space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{selectedRowsIds.length} / {table.getFilteredRowModel().rows.length}{" "}
					行を選択中
				</div>
			</div>
		</div>
	);
}
