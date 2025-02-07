// ui
import { ArrowUpDown, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectionColumn } from "@/components/custom/data-table/selection-column";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// types
import type { KoudenPermission } from "@/types/role";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { ReturnRecord } from "@/types/return-records";
import type { CellValue } from "@/types/table";

// utils
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

// constants
import { statusMap, statusPriority } from "./constants";

interface ColumnProps {
	koudenId: string;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	permission?: KoudenPermission;
}

export function createColumns({ onDeleteRows, permission }: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	// セルのフォーマット
	type FormatType = "currency" | "date" | "status" | "default";

	const formatCell = (value: CellValue, format?: FormatType): string => {
		if (value == null) return "";

		try {
			switch (format) {
				case "currency":
					return `${formatCurrency(value as number)}`;
				case "date":
					return formatDate(value as string);
				case "status":
					return statusMap[value as keyof typeof statusMap] ?? "-";
				default:
					return String(value) || "";
			}
		} catch (error) {
			console.error("[ERROR] Cell format failed:", {
				value,
				format,
				error,
			});
			return "-";
		}
	};

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<ReturnRecord> }) => (
				<SelectionColumn table={table} permission={permission} />
			),
			cell: ({ row, table }: { row: Row<ReturnRecord>; table: Table<ReturnRecord> }) => (
				<SelectionColumn table={table} row={row} permission={permission} />
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "createdAt",
			header: ({ column }: { column: Column<ReturnRecord> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					作成日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				return formatCell(row.getValue("createdAt"), "date");
			},
		},
		{
			accessorKey: "items",
			header: "返礼品",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const record = row.original;
				return (
					<div className="space-y-1">
						{record.items.map((item) => (
							<div key={item.id}>
								{item.return_item_master.name}
								{item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
							</div>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: "quantity",
			header: "数量",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const record = row.original;
				return (
					<div className="space-y-1">
						{record.items.map((item) => (
							<div key={item.id}>{item.quantity}</div>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }: { column: Column<ReturnRecord> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const record = row.original;
				const total = record.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
				return formatCell(total, "currency");
			},
		},
		{
			accessorKey: "deliveryMethod",
			header: "配送方法",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const record = row.original;
				if (record.kouden_delivery_method.delivery_method_master) {
					return record.kouden_delivery_method.delivery_method_master.name;
				}
				return record.kouden_delivery_method.name;
			},
		},
		{
			accessorKey: "shippingFee",
			header: "配送料",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const value = row.getValue("shippingFee") as number;
				return value ? formatCell(value, "currency") : "-";
			},
		},
		{
			accessorKey: "scheduledDate",
			header: "予定日",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const value = row.getValue("scheduledDate") as string;
				return formatCell(value, "date");
			},
		},
		{
			accessorKey: "completedDate",
			header: "完了日",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const value = row.getValue("completedDate") as string;
				return formatCell(value, "date");
			},
		},
		{
			accessorKey: "status",
			header: ({ column }: { column: Column<ReturnRecord> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					状態
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const value = row.getValue("status") as keyof typeof statusMap;
				return <Badge variant="secondary">{statusMap[value]}</Badge>;
			},
			sortingFn: (rowA: Row<ReturnRecord>, rowB: Row<ReturnRecord>) => {
				const a = rowA.getValue("status") as keyof typeof statusPriority;
				const b = rowB.getValue("status") as keyof typeof statusPriority;
				return statusPriority[b] - statusPriority[a];
			},
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				return formatCell(row.getValue("notes"));
			},
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }: { row: Row<ReturnRecord> }) => {
				const record = row.original;

				if (!canEdit) {
					return null;
				}

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => onDeleteRows([record.id])}
								className="text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								削除する
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
