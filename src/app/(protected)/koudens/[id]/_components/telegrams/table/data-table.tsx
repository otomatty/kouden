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
import { useAtom } from "jotai";
import type { Telegram } from "@/types/telegram";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
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
import type { KoudenPermission } from "@/types/role";
import { TelegramDialog } from "../dialog";
import type { KoudenEntry } from "@/types/kouden";
import {
	telegramStateAtom,
	telegramFilterTextAtom,
	telegramSortStateAtom,
	updateTelegramAtom,
	deleteTelegramAtom,
} from "@/store/telegrams";
import { permissionAtom } from "@/store/permission";
import { useAtomValue } from "jotai";

interface DataTableProps {
	columns: ColumnDef<Telegram>[];
	data: Telegram[];
	koudenId: string;
	koudenEntries: KoudenEntry[];
}

export function DataTable({
	columns,
	data,
	koudenId,
	koudenEntries,
}: DataTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const [filterText, setFilterText] = useAtom(telegramFilterTextAtom);
	const [sortState, setSortState] = useAtom(telegramSortStateAtom);
	const [updateTelegram] = useAtom(updateTelegramAtom);
	const [deleteTelegram] = useAtom(deleteTelegramAtom);
	const permission = useAtomValue(permissionAtom);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(
			isTablet ? tabletColumnVisibility : defaultColumnVisibility,
		);
	const [rowSelection, setRowSelection] = React.useState({});

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
				await deleteTelegram?.(ids);
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
				setRowSelection({});
			} catch (error) {
				console.error("Failed to delete telegrams:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[deleteTelegram],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting: [{ id: sortState.field, desc: sortState.direction === "desc" }],
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter: filterText,
		},
	});

	const handleCellEdit = React.useCallback(
		async (columnId: string, rowId: string, newValue: CellValue) => {
			console.log("Cell edit triggered:", { rowId, columnId, newValue });
			const row = data.find((item) => item.id === rowId);
			if (!row) {
				console.error("Row not found for editing:", rowId);
				return;
			}

			const value = newValue === null ? "" : String(newValue);

			try {
				await updateTelegram?.(row.id, {
					senderName: row.senderName,
					senderOrganization:
						columnId === "senderOrganization"
							? value || undefined
							: row.senderOrganization || undefined,
					senderPosition:
						columnId === "senderPosition"
							? value || undefined
							: row.senderPosition || undefined,
					message:
						columnId === "message"
							? value || undefined
							: row.message || undefined,
					notes:
						columnId === "notes" ? value || undefined : row.notes || undefined,
					koudenEntryId:
						columnId === "koudenEntryId"
							? value || undefined
							: row.koudenEntryId || undefined,
				});
				console.log("Cell edit successful");
			} catch (error) {
				console.error("Cell edit failed:", error);
				toast({
					title: "エラーが発生しました",
					description:
						error instanceof Error
							? error.message
							: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[data, updateTelegram],
	);

	return (
		<div className="space-y-4">
			<DataTableToolbar
				table={table}
				searchOptions={searchOptions}
				sortOptions={sortOptions}
				columnLabels={columnLabels}
				searchValue={filterText}
				onSearchChange={setFilterText}
				sortValue={`${sortState.field}_${sortState.direction}`}
				onSortChange={(value) => {
					const [field, direction] = value.split("_");
					setSortState({
						field: field as keyof Telegram,
						direction: direction as "asc" | "desc",
					});
				}}
			>
				<div className="flex items-center gap-4">
					{!isTablet && (
						<TelegramDialog koudenId={koudenId} koudenEntries={koudenEntries} />
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

			<BaseDataTable
				columns={columns}
				permission={permission}
				data={table.getFilteredRowModel().rows.map((row) => row.original)}
				editableColumns={editableColumns}
				onCellEdit={handleCellEdit}
				sorting={[
					{ id: sortState.field, desc: sortState.direction === "desc" },
				]}
				onSortingChange={(sorting) => {
					if (Array.isArray(sorting) && sorting.length > 0) {
						setSortState({
							field: sorting[0].id as keyof Telegram,
							direction: sorting[0].desc ? "desc" : "asc",
						});
					}
				}}
				columnFilters={columnFilters}
				onColumnFiltersChange={setColumnFilters}
				columnVisibility={columnVisibility}
				onColumnVisibilityChange={setColumnVisibility}
				rowSelection={rowSelection}
				onRowSelectionChange={setRowSelection}
				emptyMessage="弔電が登録されていません"
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
