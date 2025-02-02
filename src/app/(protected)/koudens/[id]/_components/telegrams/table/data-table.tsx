"use client";
// library
import * as React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// types
import type { Telegram } from "@/types/telegram";
import type { CellValue } from "@/types/table";
import type { Entry } from "@/types/entries";
// Server Actions
import { updateTelegramField, deleteTelegrams } from "@/app/_actions/telegrams";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// stores
import { permissionAtom } from "@/store/permission";
// components
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { TelegramDialog } from "../dialog/telegram-dialog";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
	createColumns,
} from "./columns";

interface DataTableProps {
	koudenId: string;
	telegrams: Telegram[];
	entries: Entry[];
	onDataChange: (telegrams: Telegram[]) => void;
}

export function DataTable({ koudenId, telegrams, entries, onDataChange }: DataTableProps) {
	const permission = useAtomValue(permissionAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	// エントリーデータの変換処理
	const normalizedTelegrams = useMemo(() => {
		return telegrams.map((telegram) => ({
			...telegram,
		}));
	}, [telegrams]);

	// データの検証
	useEffect(() => {
		if (!Array.isArray(normalizedTelegrams)) {
			console.error("[ERROR] Invalid telegrams data in DataTable:", normalizedTelegrams);
			return;
		}
	}, [normalizedTelegrams]);

	const [sorting, setSorting] = useState<SortingState>([]); //ソート
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); //列フィルター
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		isMobile ? tabletColumnVisibility : defaultColumnVisibility,
	); //列表示
	const [rowSelection, setRowSelection] = useState({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [, setSelectedRows] = useState<string[]>([]);

	// 編集ダイアログの状態
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingTelegram, setEditingTelegram] = useState<Telegram | undefined>();
	const { toast } = useToast();

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
				await deleteTelegrams(ids, koudenId);
				setSelectedRows([]);
				if (onDataChange) {
					onDataChange(normalizedTelegrams.filter((telegram) => !ids.includes(telegram.id)));
				}
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("Failed to delete telegrams:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[normalizedTelegrams, onDataChange, toast, koudenId],
	);

	// セルの編集
	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, value: CellValue) => {
			// インデックスからエントリーを取得
			const index = Number.parseInt(rowId, 10);
			const targetTelegram = normalizedTelegrams[index];

			if (!targetTelegram) {
				console.error("[ERROR] Telegram not found:", {
					rowId,
					index,
					telegramsCount: normalizedTelegrams.length,
				});
				toast({
					title: "エラーが発生しました",
					description: "対象のデータが見つかりません",
					variant: "destructive",
				});
				return;
			}

			try {
				// relationship_idの場合はキーを変換
				const fieldKey = columnId;

				const updatedTelegram = (await updateTelegramField(
					targetTelegram.id,
					fieldKey as keyof Telegram,
					value,
				)) as unknown as Telegram;

				if (onDataChange) {
					const newTelegrams = normalizedTelegrams.map((telegram) =>
						telegram.id === targetTelegram.id
							? {
									...telegram,
									...updatedTelegram,
								}
							: telegram,
					);
					onDataChange(newTelegrams);
				}

				toast({
					title: "更新完了",
					description: "データを更新しました",
				});
			} catch (error) {
				console.error("[ERROR] Update failed:", {
					error,
					targetTelegram: {
						id: targetTelegram.id,
					},
					columnId,
					fieldKey: columnId,
					value,
				});
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[normalizedTelegrams, onDataChange, toast],
	);

	// 編集ダイアログを開く
	const handleEditRow = useCallback(async (telegram: Telegram) => {
		setEditingTelegram(telegram);
		setIsEditDialogOpen(true);
	}, []);

	// 編集成功時の処理
	const handleEditSuccess = useCallback(
		(updatedTelegram: Telegram) => {
			if (onDataChange) {
				const newTelegrams = normalizedTelegrams.map((telegram) => {
					if (telegram.id === updatedTelegram.id) {
						const normalizedUpdatedTelegram = {
							...telegram,
							...updatedTelegram,
						};

						return normalizedUpdatedTelegram;
					}
					return telegram;
				});

				onDataChange(newTelegrams);
			}
			setIsEditDialogOpen(false);
			setEditingTelegram(undefined);
			toast({
				title: "更新完了",
				description: "弔電記録を更新しました",
			});
		},
		[normalizedTelegrams, onDataChange, toast],
	);

	const columns = useMemo(
		() =>
			createColumns({
				onEditRow: handleEditRow,
				onDeleteRows: handleDeleteRows,
				onCellEdit: handleCellEdit,
				selectedRows: selectedRowsIds,
				permission,
				entries,
			}),
		[handleEditRow, handleDeleteRows, handleCellEdit, selectedRowsIds, permission, entries],
	);

	const table = useReactTable({
		data: Array.isArray(normalizedTelegrams) ? normalizedTelegrams : [],
		columns: columns as ColumnDef<Telegram, CellValue>[],
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
			const searchableColumns = ["senderName", "senderOrganization", "senderPosition"];

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
			{!Array.isArray(normalizedTelegrams) ? (
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
								<TelegramDialog
									koudenId={koudenId}
									entries={entries}
									variant="create"
									open={isCreateDialogOpen}
									onOpenChange={setIsCreateDialogOpen}
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

					<BaseDataTable
						permission={permission}
						columns={columns as ColumnDef<Telegram, CellValue>[]}
						data={table.getFilteredRowModel().rows.map((row) => row.original)}
						editableColumns={{
							...editableColumns,
						}}
						sorting={sorting}
						onSortingChange={setSorting}
						columnFilters={columnFilters}
						onColumnFiltersChange={setColumnFilters}
						columnVisibility={columnVisibility}
						onColumnVisibilityChange={setColumnVisibility}
						rowSelection={rowSelection}
						onRowSelectionChange={setRowSelection}
						onCellEdit={handleCellEdit}
						emptyMessage="弔電の記録がありません"
					/>

					{/* 編集ダイアログ */}
					<TelegramDialog
						koudenId={koudenId}
						entries={entries}
						defaultValues={editingTelegram}
						open={isEditDialogOpen}
						onOpenChange={setIsEditDialogOpen}
						onSuccess={handleEditSuccess}
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
}
