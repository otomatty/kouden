"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	useReactTable,
	getCoreRowModel,
} from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";

interface DataTableProps {
	columns: ColumnDef<KoudenMember>[];
	data: KoudenMember[];
}

export function DataTable({ columns, data }: DataTableProps) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<Card className="p-4">
			<Table>
				<TableHeader>
					<TableRow>
						{table
							.getHeaderGroups()
							.map((headerGroup) =>
								headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</TableHead>
								)),
							)}
					</TableRow>
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="text-center">
								メンバーがいません
							</TableCell>
						</TableRow>
					) : (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</Card>
	);
}
