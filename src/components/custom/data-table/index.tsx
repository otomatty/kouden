import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
	type Cell,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { EditableCell } from "./editable-cell";
import { SelectCell } from "./select-cell";
import type { DataTableProps, CellValue } from "./types";

export function DataTable<TData>({
	columns,
	data,
	editableColumns = {},
	onCellEdit,
	sorting = [],
	onSortingChange,
	columnFilters = [],
	onColumnFiltersChange,
	columnVisibility = {},
	onColumnVisibilityChange,
	rowSelection = {},
	onRowSelectionChange,
	emptyMessage = "データがありません",
	headerClassName,
	bodyClassName,
	cellClassName,
}: DataTableProps<TData, CellValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: onSortingChange,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: onColumnFiltersChange,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: onColumnVisibilityChange,
		onRowSelectionChange: onRowSelectionChange,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	const renderCell = React.useCallback(
		(cell: Cell<TData, CellValue>, columnId: string) => {
			const config = editableColumns[columnId];
			if (!config || config.type === "readonly") {
				return flexRender(cell.column.columnDef.cell, cell.getContext());
			}

			const value = cell.getValue();
			const rowId = cell.row.id;

			const handleSave = async (newValue: CellValue) => {
				if (onCellEdit) {
					await onCellEdit(columnId, rowId, newValue);
				}
			};

			switch (config.type) {
				case "select":
				case "boolean":
					return (
						<SelectCell
							value={value}
							options={config.options || []}
							onSave={handleSave}
						/>
					);
				case "number":
					return (
						<EditableCell
							value={value as string | number | null}
							onSave={handleSave}
							type="number"
							format={config.format}
						/>
					);
				case "postal_code":
					return (
						<EditableCell
							value={value as string | number | null}
							onSave={handleSave}
							format="postal_code"
						/>
					);
				default:
					return (
						<EditableCell
							value={value as string | number | null}
							onSave={handleSave}
						/>
					);
			}
		},
		[editableColumns, onCellEdit],
	);

	return (
		<div className="rounded-md border overflow-hidden">
			<div className="relative">
				<Table>
					<TableHeader
						className={cn(
							"sticky top-0 z-10 bg-background shadow-sm",
							headerClassName,
						)}
					>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className={cn(
											"bg-background border-r last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis",
											cellClassName,
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className={bodyClassName}>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row, i) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={i % 2 === 0 ? "bg-background" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={cn(
												"border-r last:border-r-0 overflow-hidden text-ellipsis",
												cellClassName,
											)}
										>
											{renderCell(cell, cell.column.id)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
