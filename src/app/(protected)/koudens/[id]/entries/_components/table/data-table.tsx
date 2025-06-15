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
import { useSearchParams } from "next/navigation";

// ui
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
// types
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type { AttendanceType } from "@/types/entries";
import type { CellValue } from "@/types/table";
import type { SelectOption } from "@/types/additional-select";
// Server Actions
import { deleteEntries, updateEntryField } from "@/app/_actions/entries";
import { getMembers } from "@/app/_actions/members";
import { createRelationship } from "@/app/_actions/relationships";
// hooks
import { useMediaQuery } from "@/hooks/use-media-query";
// stores
import { permissionAtom } from "@/store/permission";
import { userAtom } from "@/store/auth";
import { duplicateEntriesAtom } from "@/store/duplicateEntries";
// components
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { TableSkeleton } from "@/components/custom/loading/skeletons";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { EntryDialog } from "../dialog/entry-dialog";
import { createColumns } from "./columns";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
	editableColumns,
} from "./constants";

interface EntryTableProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
	onDataChange: (entries: Entry[]) => void;
	currentPage: number;
	pageSize: number;
	totalCount: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	sortValue?: string;
	onSortChange?: (value: string) => void;
	// 作成日フィルター
	showDateFilter?: boolean;
	dateRange?: { from?: Date; to?: Date };
	onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
	// 複製エントリフィルター
	duplicateFilter?: boolean;
	onDuplicateFilterChange?: (value: boolean) => void;
	// 管理者モード
	isAdminMode?: boolean;
}

export function DataTable({
	koudenId,
	entries = [],
	relationships = [],
	onDataChange,
	currentPage,
	pageSize,
	totalCount,
	onPageChange,
	onPageSizeChange,
	searchValue,
	onSearchChange,
	sortValue,
	onSortChange,
	showDateFilter,
	dateRange,
	onDateRangeChange,
	duplicateFilter = false,
	onDuplicateFilterChange,
	isAdminMode = false,
}: EntryTableProps) {
	const permission = useAtomValue(permissionAtom);
	const duplicateResults = useAtomValue(duplicateEntriesAtom);
	const user = useAtomValue(userAtom);
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
	// Initialize viewScope and selectedMemberIds from URL search params for consistency with server filtering
	const searchParams = useSearchParams();
	const memberIdsParam = searchParams.get("memberIds") ?? "";
	const parsedMemberIds = memberIdsParam
		? memberIdsParam
				.split(",")
				.map((id) => id.trim())
				.filter(Boolean)
		: [];
	// Safely derive initial viewScope without non-null assertion
	const viewScopeParam = searchParams.get("viewScope");
	const initialViewScope: "own" | "all" | "others" =
		viewScopeParam === "own" || viewScopeParam === "all" || viewScopeParam === "others"
			? viewScopeParam
			: "all";
	const [viewScope, setViewScope] = useState<"own" | "all" | "others">(initialViewScope);
	const [members, setMembers] = useState<{ value: string; label: string }[]>([]);
	const [relationshipOptions, setRelationshipOptions] = useState<Relationship[]>(relationships);
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(parsedMemberIds);
	const [, setSelectedRows] = useState<string[]>([]);
	const { toast } = useToast();

	// 関係性データの正規化
	const normalizedRelationships = useMemo(() => {
		if (!Array.isArray(relationships)) {
			console.error("[ERROR] Invalid relationships data:", relationships);
			return [];
		}
		return relationships;
	}, [relationships]);

	// エントリーデータの正規化
	const normalizedEntries = useMemo(() => {
		if (!Array.isArray(entries)) {
			console.error("[ERROR] Invalid entries data:", entries);
			return [];
		}

		return entries
			.map((entry) => {
				if (!entry) {
					console.error("[ERROR] Invalid entry:", entry);
					return null;
				}

				return {
					...entry,
					relationshipId: entry.relationship_id ?? null,
					attendanceType: entry.attendance_type as AttendanceType,
					hasOffering: entry.has_offering ?? false,
					// 返礼完了状況の判定: 新しいreturn_statusがCOMPLETEDの場合、またはreturn_statusがなくis_return_completedがtrueの場合
					isReturnCompleted:
						entry.return_status === "COMPLETED" ||
						(!entry.return_status && (entry.is_return_completed ?? false)),
					createdAt: entry.created_at,
					updatedAt: entry.updated_at,
					createdBy: entry.created_by,
					lastModifiedAt: entry.last_modified_at,
					lastModifiedBy: entry.last_modified_by,
					postalCode: entry.postal_code ?? null,
					phoneNumber: entry.phone_number ?? null,
				};
			})
			.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
	}, [entries]);

	// データの検証とエラーハンドリング
	useEffect(() => {
		try {
			setIsLoading(true);

			if (!Array.isArray(normalizedEntries)) {
				throw new Error("Invalid entries data in DataTable");
			}
			if (!Array.isArray(normalizedRelationships)) {
				throw new Error("Invalid relationships data in DataTable");
			}

			// データの整合性チェック
			const relationshipIds = new Set(normalizedRelationships.map((r) => r.id));
			const entriesWithInvalidRelationships = normalizedEntries.filter(
				(e) => e.relationshipId && !relationshipIds.has(e.relationshipId),
			);

			if (entriesWithInvalidRelationships.length > 0) {
				console.warn("[WARN] Entries with invalid relationship IDs:", {
					entriesCount: entriesWithInvalidRelationships.length,
					firstFewEntries: entriesWithInvalidRelationships.slice(0, 3),
					validRelationshipIds: Array.from(relationshipIds),
				});
			}

			setError(null);
		} catch (err) {
			console.error("[ERROR] Data validation failed:", err);
			setError(err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [normalizedEntries, normalizedRelationships]);

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
				await deleteEntries(ids, koudenId);
				setSelectedRows([]);
				if (onDataChange) {
					onDataChange(normalizedEntries.filter((entry) => !ids.includes(entry.id)));
				}
				toast({
					title: "削除完了",
					description: `${ids.length}件のデータを削除しました`,
				});
			} catch (error) {
				console.error("Failed to delete entries:", error);
				toast({
					title: "エラーが発生しました",
					description: "データの削除に失敗しました",
					variant: "destructive",
				});
			}
		},
		[koudenId, normalizedEntries, onDataChange, toast],
	);

	// セルの編集
	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, value: CellValue) => {
			// エントリIDからエントリーを取得
			const targetEntry = normalizedEntries.find((e) => e.id === rowId);

			if (!targetEntry) {
				console.error("[DEBUG handleCellEdit] targetEntry not found for rowId=", rowId);
				console.error("[ERROR] Entry not found:", {
					rowId,
					entriesCount: normalizedEntries.length,
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
				const fieldKey = columnId === "relationshipId" ? "relationship_id" : columnId;

				const updatedEntry = (await updateEntryField(
					targetEntry.id,
					fieldKey as keyof Omit<Entry, "relationship">,
					value,
				)) as unknown as Entry;

				if (onDataChange) {
					const newEntries = normalizedEntries.map((entry) =>
						entry.id === targetEntry.id
							? {
									...entry,
									...updatedEntry,
									relationshipId: updatedEntry.relationship_id, // 明示的に更新
								}
							: entry,
					);
					onDataChange(newEntries);
				}

				toast({
					title: "更新完了",
					description: "データを更新しました",
				});
			} catch (error) {
				console.error("[ERROR] Update failed:", {
					error,
					targetEntry: {
						id: targetEntry.id,
					},
					columnId,
					fieldKey: columnId === "relationshipId" ? "relationship_id" : columnId,
					value,
				});
				toast({
					title: "エラーが発生しました",
					description: "データの更新に失敗しました",
					variant: "destructive",
				});
			}
		},
		[normalizedEntries, onDataChange, toast],
	);

	// カラムの生成
	const columns = useMemo(
		() =>
			createColumns({
				onDeleteRows: handleDeleteRows,
				selectedRows: selectedRowsIds,
				relationships: relationships as Relationship[],
				permission,
				koudenId,
			}),
		[handleDeleteRows, selectedRowsIds, relationships, permission, koudenId],
	);

	// 追加: 表示対象に基づくエントリフィルタリング
	const filteredEntries = useMemo(() => {
		let result = normalizedEntries;
		if (viewScope === "own") {
			result = result.filter((e) => e.createdBy === user?.id);
		} else if (viewScope === "others") {
			result = result.filter((e) => e.createdBy !== user?.id);
		}
		// メンバー選択によるフィルタ
		if (selectedMemberIds.length > 0) {
			result = result.filter((e) => selectedMemberIds.includes(e.createdBy));
		}
		return result;
	}, [normalizedEntries, viewScope, user, selectedMemberIds]);

	// 重複結果がある場合は重複エントリのみ表示
	const displayEntries = useMemo(() => {
		if (duplicateResults === null) return filteredEntries;
		const idsSet = new Set<string>(duplicateResults.flatMap((r) => r.ids));
		return filteredEntries.filter((entry) => idsSet.has(entry.id));
	}, [filteredEntries, duplicateResults]);

	// 重複結果がある場合にページネーション適用
	const [dupPage, setDupPage] = useState(1);
	const [dupPageSize, setDupPageSize] = useState(pageSize);
	useEffect(() => {
		setDupPage(1);
	}, []);
	const paginatedEntries = useMemo(() => {
		if (duplicateResults === null) return displayEntries;
		const start = (dupPage - 1) * dupPageSize;
		return displayEntries.slice(start, start + dupPageSize);
	}, [displayEntries, dupPage, dupPageSize, duplicateResults]);

	// メンバーをサーバーから取得
	useEffect(() => {
		(async () => {
			try {
				let mems;
				if (isAdminMode) {
					// 管理者モードの場合は管理者用関数を使用
					const { getMembersForAdmin } = await import("@/app/_actions/members");
					mems = await getMembersForAdmin(koudenId);
				} else {
					// 通常モードの場合は通常の関数を使用
					mems = await getMembers(koudenId);
				}
				setMembers(
					mems.map((m) => ({
						value: m.user_id,
						label: m.profile?.display_name || m.user_id,
					})),
				);
			} catch (error) {
				console.error("[ERROR] Failed to fetch members:", error);
			}
		})();
	}, [koudenId, isAdminMode]);

	useEffect(() => {
		setRelationshipOptions(relationships);
	}, [relationships]);

	// Determine data source: use paginated entries normally, but show all duplicates when duplicateResults exist
	const dataForTable = duplicateResults === null ? paginatedEntries : displayEntries;
	const table = useReactTable({
		data: Array.isArray(dataForTable) ? dataForTable : [],
		columns: columns as ColumnDef<Entry, CellValue>[],
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

	const renderContent = () => {
		if (isLoading) {
			// ローディング中はテーブルスケルトンを表示
			return <TableSkeleton columns={Object.values(columnLabels)} />;
		}

		if (error) {
			return <div>エラーが発生しました: {error.message}</div>;
		}

		return (
			<div className="space-y-4">
				{!Array.isArray(normalizedEntries) ? (
					<div className="text-center text-muted-foreground">データの読み込みに失敗しました</div>
				) : (
					<>
						<DataTableToolbar
							table={table}
							searchOptions={searchOptions}
							sortOptions={sortOptions}
							columnLabels={columnLabels}
							showScopeSelection={true}
							viewScope={viewScope}
							onViewScopeChange={setViewScope}
							members={members}
							selectedMemberIds={selectedMemberIds}
							onMemberSelectionChange={setSelectedMemberIds}
							showDateFilter={showDateFilter}
							dateRange={dateRange}
							onDateRangeChange={onDateRangeChange}
							duplicateFilter={duplicateFilter}
							onDuplicateFilterChange={onDuplicateFilterChange}
							showPagination={duplicateResults === null}
							currentPage={duplicateResults === null ? currentPage : dupPage}
							pageSize={duplicateResults === null ? pageSize : dupPageSize}
							totalCount={duplicateResults === null ? totalCount : displayEntries.length}
							onPageChange={duplicateResults === null ? onPageChange : setDupPage}
							onPageSizeChange={
								duplicateResults === null
									? onPageSizeChange
									: (size) => {
											setDupPageSize(size);
											setDupPage(1);
										}
							}
							searchValue={searchValue}
							onSearchChange={onSearchChange}
							sortValue={sortValue}
							onSortChange={onSortChange}
						>
							<div className="flex items-center justify-end">
								{!isMobile && (
									<EntryDialog
										koudenId={koudenId}
										relationships={relationships}
										variant="create"
										shortcutKey="k"
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
							columns={columns as ColumnDef<Entry, CellValue>[]}
							data={table.getFilteredRowModel().rows.map((row) => row.original)}
							editableColumns={{
								...editableColumns,
								relationshipId: {
									type: "additional-select" as const,
									options: relationshipOptions.map((rel) => ({ value: rel.id, label: rel.name })),
									addOptionPlaceholder: "関係性を追加",
									onAddOption: async (option: SelectOption) => {
										const newRel = await createRelationship({ koudenId, name: option.value });
										setRelationshipOptions((prev) => [...prev, newRel]);
										return newRel.id;
									},
								},
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
							emptyMessage="香典の記録がありません"
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
