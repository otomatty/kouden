"use client";

import {
	useReactTable,
	getCoreRowModel,
	flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { KoudenEntrySpreadsheetProps, SpreadsheetData } from "./types";
import { createColumns } from "./columns";
import { useKoudenEntrySpreadsheet } from "./use-kouden-entry-spreadsheet";
import { useEffect } from "react";

export function KoudenEntrySpreadsheet(props: KoudenEntrySpreadsheetProps) {
	const router = useRouter();
	const {
		data,
		relationships,
		selectedRows,
		handleCellChange,
		handleRowSelectionChange,
		handleDeleteSelectedRows,
		handleAddRow,
	} = useKoudenEntrySpreadsheet(props);

	// キーボードショートカットの設定
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				handleAddRow();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleAddRow]);

	const columns = createColumns(
		relationships,
		handleRowSelectionChange,
		handleCellChange,
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				{selectedRows.size > 0 && (
					<Button
						variant="destructive"
						size="sm"
						onClick={handleDeleteSelectedRows}
						className="flex items-center gap-2"
					>
						<Trash2 className="h-4 w-4" />
						<span>{selectedRows.size}件を削除</span>
					</Button>
				)}
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="border border-gray-200 bg-gray-50 p-2 text-left text-sm font-medium text-gray-500"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="border border-gray-200 p-2">
										{flexRender(cell.column.columnDef.cell, {
											...cell.getContext(),
											onValueChange: (
												value: SpreadsheetData[keyof SpreadsheetData],
											) =>
												handleCellChange(
													row.original.id,
													cell.column.id as keyof SpreadsheetData,
													value,
												),
										})}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex justify-center">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleAddRow}
					className="flex items-center gap-2"
				>
					<PlusCircle className="h-4 w-4" />
					<span>行を追加 (Ctrl+Enter)</span>
				</Button>
			</div>
		</div>
	);
}
