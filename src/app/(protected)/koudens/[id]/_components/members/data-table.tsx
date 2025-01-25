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
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	useReactTable,
	getCoreRowModel,
} from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import { v4 as uuidv4 } from "uuid";

interface DataTableProps {
	columns: ColumnDef<KoudenMember>[];
	data: KoudenMember[];
	isLoading?: boolean;
}

export function DataTable({
	columns,
	data,
	isLoading = false,
}: DataTableProps) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const skeletonRows = Array.from({ length: 3 }, () => ({
		id: uuidv4(),
		cells: Array.from({ length: columns.length }, () => uuidv4()),
	}));

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
					{isLoading ? (
						<>
							{skeletonRows.map((row) => (
								<TableRow key={row.id}>
									{row.cells.map((cellId) => (
										<TableCell key={cellId}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									))}
								</TableRow>
							))}
						</>
					) : table.getRowModel().rows.length === 0 ? (
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
