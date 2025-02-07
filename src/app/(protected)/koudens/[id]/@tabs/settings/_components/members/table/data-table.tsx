"use client";

import * as React from "react";
import { DataTable as BaseDataTable } from "@/components/custom/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission } from "@/types/role";
import { v4 as uuidv4 } from "uuid";
import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	type VisibilityState,
} from "@tanstack/react-table";
import { DataTableToolbar } from "@/components/custom/data-table/toolbar";
import { ShareLinkForm } from "../share-link-dialog";
import type { KoudenRole } from "@/types/role";
import {
	columnLabels,
	searchOptions,
	sortOptions,
	defaultColumnVisibility,
	tabletColumnVisibility,
} from "./columns";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MembersTableProps {
	columns: ColumnDef<KoudenMember>[];
	data: KoudenMember[];
	isLoading?: boolean;
	permission: KoudenPermission;
	koudenId: string;
	roles?: KoudenRole[];
}

export function MembersTable({
	columns,
	data,
	permission,
	koudenId,
	roles = [],
	isLoading = false,
}: MembersTableProps) {
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
		isTablet ? tabletColumnVisibility : defaultColumnVisibility,
	);
	const [globalFilter, setGlobalFilter] = React.useState("");

	// 画面サイズが変更された時に列の表示状態を更新
	React.useEffect(() => {
		setColumnVisibility(isTablet ? tabletColumnVisibility : defaultColumnVisibility);
	}, [isTablet]);

	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		enableGlobalFilter: true,
		globalFilterFn: (row, _columnId, filterValue) => {
			if (!filterValue) return true;

			const searchValue = String(filterValue).toLowerCase();
			const searchableColumns = ["member", "role"];

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
			globalFilter,
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-10 w-[250px]" />
					<Skeleton className="h-10 w-[200px]" />
				</div>
				<div className="space-y-2">
					{Array.from({ length: 3 }, () => uuidv4()).map((id) => (
						<Skeleton key={id} className="h-16 w-full" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<DataTableToolbar
				searchOptions={searchOptions}
				sortOptions={sortOptions}
				columnLabels={columnLabels}
				table={table}
			>
				{permission === "owner" && (
					<div className="flex items-center justify-end">
						<ShareLinkForm koudenId={koudenId} roles={roles} />
					</div>
				)}
			</DataTableToolbar>
			<BaseDataTable
				permission={permission}
				columns={columns}
				data={data}
				sorting={sorting}
				onSortingChange={setSorting}
				columnFilters={columnFilters}
				onColumnFiltersChange={setColumnFilters}
				columnVisibility={columnVisibility}
				onColumnVisibilityChange={setColumnVisibility}
				emptyMessage="メンバーがいません"
			/>
		</div>
	);
}
