"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { TableSkeleton } from "@/components/custom/loading/skeletons";
import type { CellValue } from "@/types/data-table/table";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import { EntryDialog } from "../dialog/entry-dialog";
import { BulkDeleteEntriesDialog } from "./bulk-delete-entries-dialog";
import { columnLabels, searchOptions, sortOptions } from "./constants";
import { useEntryTable } from "./hooks/use-entry-table";

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
	showDateFilter?: boolean;
	dateRange?: { from?: Date; to?: Date };
	onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
	duplicateFilter?: boolean;
	onDuplicateFilterChange?: (value: boolean) => void;
	isAdminMode?: boolean;
}

export function DataTable(props: EntryTableProps) {
	const {
		koudenId,
		relationships,
		searchValue,
		onSearchChange,
		sortValue,
		onSortChange,
		showDateFilter,
		dateRange,
		onDateRangeChange,
		duplicateFilter = false,
		onDuplicateFilterChange,
	} = props;

	const {
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
	} = useEntryTable(props);

	if (isLoading) {
		return <TableSkeleton columns={Object.values(columnLabels)} />;
	}

	if (error) {
		return <div>エラーが発生しました: {error.message}</div>;
	}

	if (!Array.isArray(normalizedEntries)) {
		return (
			<div className="text-center text-muted-foreground">データの読み込みに失敗しました</div>
		);
	}

	return (
		<div className="space-y-4">
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
				showPagination={pagination.showPagination}
				currentPage={pagination.currentPage}
				pageSize={pagination.pageSize}
				totalCount={pagination.totalCount}
				onPageChange={pagination.onPageChange}
				onPageSizeChange={pagination.onPageSizeChange}
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				sortValue={sortValue}
				onSortChange={onSortChange}
			>
				<div className="flex items-center justify-end" data-tour="add-entry-button">
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

			<BulkDeleteEntriesDialog
				selectedCount={selectedRowsIds.length}
				onConfirm={() => handleDeleteRows(selectedRowsIds)}
			/>

			<BaseDataTable
				permission={permission}
				columns={columns as ColumnDef<Entry, CellValue>[]}
				data={table.getFilteredRowModel().rows.map((row) => row.original)}
				editableColumns={editableColumnsConfig}
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
		</div>
	);
}
