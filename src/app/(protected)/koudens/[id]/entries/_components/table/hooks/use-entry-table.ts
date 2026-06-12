import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { updateEntryField } from "@/app/_actions/entries";
import { getMembers } from "@/app/_actions/members";
import { createRelationship } from "@/app/_actions/relationships";
import { useMediaQuery } from "@/hooks/use-media-query";
import { userAtom } from "@/store/auth";
import { duplicateEntriesAtom } from "@/store/duplicateEntries";
import { permissionAtom } from "@/store/permission";
import type { SelectOption } from "@/types/data-table/additional-select";
import type { CellValue } from "@/types/data-table/table";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { toast } from "sonner";
import { createColumns } from "../columns";
import {
	defaultColumnVisibility,
	editableColumns,
	tabletColumnVisibility,
} from "../constants";
import { normalizeEntries, normalizeRelationships } from "../normalize-entries";
import { useBulkDeleteEntries } from "./use-bulk-delete-entries";

interface UseEntryTableOptions {
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
	showDateFilter?: boolean;
	dateRange?: { from?: Date; to?: Date };
	onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
	duplicateFilter?: boolean;
	onDuplicateFilterChange?: (value: boolean) => void;
	isAdminMode?: boolean;
}

export function useEntryTable({
	koudenId,
	entries = [],
	relationships = [],
	onDataChange,
	currentPage,
	pageSize,
	totalCount,
	onPageChange,
	onPageSizeChange,
	isAdminMode = false,
}: UseEntryTableOptions) {
	const permission = useAtomValue(permissionAtom);
	const duplicateResults = useAtomValue(duplicateEntriesAtom);
	const user = useAtomValue(userAtom);
	const isMobile = useMediaQuery("(max-width: 767px)");
	const searchParams = useSearchParams();

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
		isMobile ? tabletColumnVisibility : defaultColumnVisibility,
	);
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [globalFilter, setGlobalFilter] = useState("");

	const memberIdsParam = searchParams.get("memberIds") ?? "";
	const parsedMemberIds = memberIdsParam
		? memberIdsParam
				.split(",")
				.map((id) => id.trim())
				.filter(Boolean)
		: [];
	const viewScopeParam = searchParams.get("viewScope");
	const initialViewScope: "own" | "all" | "others" =
		viewScopeParam === "own" || viewScopeParam === "all" || viewScopeParam === "others"
			? viewScopeParam
			: "all";

	const [viewScope, setViewScope] = useState<"own" | "all" | "others">(initialViewScope);
	const [members, setMembers] = useState<{ value: string; label: string }[]>([]);
	const [relationshipOptions, setRelationshipOptions] = useState<Relationship[]>(relationships);
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(parsedMemberIds);
	const [dupPage, setDupPage] = useState(1);
	const [dupPageSize, setDupPageSize] = useState(pageSize);

	const normalizedRelationships = useMemo(
		() => normalizeRelationships(relationships),
		[relationships],
	);
	const normalizedEntries = useMemo(() => normalizeEntries(entries), [entries]);

	const { selectedRowsIds, handleDeleteRows } = useBulkDeleteEntries({
		koudenId,
		normalizedEntries,
		onDataChange,
		setRowSelection,
		rowSelection,
	});

	useEffect(() => {
		try {
			if (!Array.isArray(normalizedEntries)) {
				throw new Error("Invalid entries data in DataTable");
			}
			if (!Array.isArray(normalizedRelationships)) {
				throw new Error("Invalid relationships data in DataTable");
			}

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

	useEffect(() => {
		setColumnVisibility(isMobile ? tabletColumnVisibility : defaultColumnVisibility);
	}, [isMobile]);

	useEffect(() => {
		setDupPage(1);
	}, []);

	useEffect(() => {
		setRelationshipOptions(relationships);
	}, [relationships]);

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				let memsResult: Awaited<ReturnType<typeof getMembers>>;
				if (isAdminMode) {
					const { getMembersForAdmin } = await import("@/app/_actions/members");
					memsResult = await getMembersForAdmin(koudenId);
				} else {
					memsResult = await getMembers(koudenId);
				}
				if (!isMounted) return;
				if (!memsResult.ok) {
					console.error("[ERROR] Failed to fetch members:", memsResult.error);
					return;
				}
				const mems = memsResult.data;
				setMembers(
					mems.map((m) => ({
						value: m.user_id,
						label: m.profile?.display_name || m.user_id,
					})),
				);
			} catch (fetchError) {
				if (isMounted) {
					console.error("[ERROR] Failed to fetch members:", fetchError);
				}
			}
		})();
		return () => {
			isMounted = false;
		};
	}, [koudenId, isAdminMode]);

	const handleCellEdit = useCallback(
		async (columnId: string, rowId: string, value: CellValue) => {
			const targetEntry = normalizedEntries.find((e) => e.id === rowId);

			if (!targetEntry) {
				console.error("[DEBUG handleCellEdit] targetEntry not found for rowId=", rowId);
				console.error("[ERROR] Entry not found:", {
					rowId,
					entriesCount: normalizedEntries.length,
				});
				toast.error("対象のデータが見つかりません", {
					description: "エントリーが存在しないか、既に削除されている可能性があります",
				});
				return;
			}

			try {
				const fieldKey = columnId === "relationshipId" ? "relationship_id" : columnId;

				const result = await updateEntryField(
					targetEntry.id,
					fieldKey as keyof Omit<Entry, "relationship">,
					value,
				);

				if (!result.ok) {
					toast.error("データの更新に失敗しました", {
						description: result.error.message,
					});
					return;
				}

				const updatedEntry = result.data;

				if (onDataChange) {
					const newEntries = normalizedEntries.map((entry) =>
						entry.id === targetEntry.id
							? {
									...entry,
									...updatedEntry,
									relationshipId: updatedEntry.relationship_id,
								}
							: entry,
					);
					onDataChange(newEntries);
				}

				toast.success("データを更新しました", {
					description: "変更内容が正常に保存されました",
				});
			} catch (updateError) {
				console.error("[ERROR] Update failed:", {
					error: updateError,
					targetEntry: {
						id: targetEntry.id,
					},
					columnId,
					fieldKey: columnId === "relationshipId" ? "relationship_id" : columnId,
					value,
				});
				toast.error("データの更新に失敗しました", {
					description: "しばらく時間をおいてから再度お試しください",
				});
			}
		},
		[normalizedEntries, onDataChange],
	);

	const columns = useMemo(
		() =>
			createColumns({
				onDeleteRows: handleDeleteRows,
				selectedRows: selectedRowsIds,
				relationships: relationships as Relationship[],
				permission,
				koudenId,
			}),
		[handleDeleteRows, relationships, permission, koudenId],
	);

	const filteredEntries = useMemo(() => {
		let result = normalizedEntries;
		if (viewScope === "own") {
			result = result.filter((e) => e.createdBy === user?.id);
		} else if (viewScope === "others") {
			result = result.filter((e) => e.createdBy !== user?.id);
		}
		if (selectedMemberIds.length > 0) {
			result = result.filter((e) => selectedMemberIds.includes(e.createdBy));
		}
		return result;
	}, [normalizedEntries, viewScope, user, selectedMemberIds]);

	const displayEntries = useMemo(() => {
		if (duplicateResults === null) return filteredEntries;
		const idsSet = new Set<string>(duplicateResults.flatMap((r) => r.ids));
		return filteredEntries.filter((entry) => idsSet.has(entry.id));
	}, [filteredEntries, duplicateResults]);

	const paginatedEntries = useMemo(() => {
		if (duplicateResults === null) return displayEntries;
		const start = (dupPage - 1) * dupPageSize;
		return displayEntries.slice(start, start + dupPageSize);
	}, [displayEntries, dupPage, dupPageSize, duplicateResults]);

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

			return searchableColumns.some((columnId) => {
				const value = row.getValue(columnId);
				return value != null && String(value).toLowerCase().includes(searchValue);
			});
		},
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
		},
	});

	const editableColumnsConfig = useMemo(
		() => ({
			...editableColumns,
			relationshipId: {
				type: "additional-select" as const,
				options: relationshipOptions.map((rel) => ({ value: rel.id, label: rel.name })),
				addOptionPlaceholder: "関係性を追加",
				onAddOption: async (option: SelectOption) => {
					const result = await createRelationship({ koudenId, name: option.value });
					if (!result.ok) {
						throw new Error(result.error.message);
					}
					const newRel = result.data;
					setRelationshipOptions((prev) => [...prev, newRel]);
					return newRel.id;
				},
			},
		}),
		[koudenId, relationshipOptions],
	);

	const pagination = useMemo(
		() => ({
			showPagination: duplicateResults === null,
			currentPage: duplicateResults === null ? currentPage : dupPage,
			pageSize: duplicateResults === null ? pageSize : dupPageSize,
			totalCount: duplicateResults === null ? totalCount : displayEntries.length,
			onPageChange: duplicateResults === null ? onPageChange : setDupPage,
			onPageSizeChange:
				duplicateResults === null
					? onPageSizeChange
					: (size: number) => {
							setDupPageSize(size);
							setDupPage(1);
						},
		}),
		[
			duplicateResults,
			currentPage,
			dupPage,
			pageSize,
			dupPageSize,
			totalCount,
			displayEntries.length,
			onPageChange,
			onPageSizeChange,
		],
	);

	return {
		isLoading,
		error,
		isMobile,
		table,
		columns,
		normalizedEntries,
		permission,
		viewScope,
		setViewScope,
		members,
		selectedMemberIds,
		setSelectedMemberIds,
		selectedRowsIds,
		handleDeleteRows,
		handleCellEdit,
		editableColumnsConfig,
		sorting,
		setSorting,
		columnFilters,
		setColumnFilters,
		columnVisibility,
		setColumnVisibility,
		rowSelection,
		setRowSelection,
		pagination,
	};
}
