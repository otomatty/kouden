// ui
import { ArrowUpDown, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type ReturnStatus } from "@/components/ui/status-badge";
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
import type { Entry, AttendanceType } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type { CellValue } from "@/types/data-table/table";
// utils
import { formatCurrency } from "@/utils/currency";
import { formatPostalCode } from "@/utils/postal-code";
// components
import { EntryDialog } from "../dialog/entry-dialog";
// constants
import {
	attendanceTypeMap,
	attendanceTypePriority,
	returnStatusPriority,
	offeringMap,
	offeringPriority,
} from "./constants";

interface ColumnProps {
	koudenId: string;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	permission?: KoudenPermission;
	relationships: Relationship[];
}

export function createColumns({ onDeleteRows, relationships, permission, koudenId }: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	// セルのフォーマット
	type FormatType = "currency" | "postal_code" | "attendance" | "default";

	const formatCell = (value: CellValue, format?: FormatType): string => {
		if (value == null) return "";

		try {
			switch (format) {
				case "currency":
					return `${formatCurrency(value as number)}`;
				case "postal_code":
					return `${formatPostalCode(value as string)}`;
				case "attendance":
					return attendanceTypeMap[value as AttendanceType] ?? "-";
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
			header: ({ table }: { table: Table<Entry> }) => (
				<SelectionColumn table={table} permission={permission} />
			),
			cell: ({ row, table }: { row: Row<Entry>; table: Table<Entry> }) => (
				<SelectionColumn table={table} row={row} permission={permission} />
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "createdAt",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					作成日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const date = new Date(row.getValue("created_at") as string);
				return date.toLocaleString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
				});
			},
		},
		{
			accessorKey: "name",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご芳名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("name") as string;

				return formatCell(value);
			},
		},
		{
			accessorKey: "organization",
			header: "団体名",
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("organization") as string;

				return formatCell(value);
			},
		},
		{
			accessorKey: "position",
			header: "役職",
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("position") as string;

				return formatCell(value);
			},
		},
		{
			accessorKey: "relationshipId",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご関係
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const relationshipId =
					(row.getValue("relationshipId") as string) || row.original.relationship_id;
				const relationship = relationships.find((r) => r.id === relationshipId);

				// 編集不可の場合は通常のテキスト表示
				return relationship ? relationship.name : "";
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("amount") as number;

				return formatCell(value, "currency");
			},
		},
		{
			accessorKey: "postalCode",
			header: "郵便番号",
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("postalCode") as string;

				return formatCell(value, "postal_code");
			},
		},
		{
			accessorKey: "address",
			header: "住所",
			cell: ({ row }: { row: Row<Entry> }) => formatCell(row.getValue("address")),
		},
		{
			accessorKey: "phoneNumber",
			header: "電話番号",
			cell: ({ row }: { row: Row<Entry> }) => formatCell(row.getValue("phoneNumber")),
		},
		{
			accessorKey: "attendanceType",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					参列
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("attendanceType") as keyof typeof attendanceTypeMap;
				return <Badge variant="outline">{attendanceTypeMap[value]}</Badge>;
			},
			sortingFn: (rowA: Row<Entry>, rowB: Row<Entry>) => {
				const a = rowA.getValue("attendanceType") as keyof typeof attendanceTypePriority;
				const b = rowB.getValue("attendanceType") as keyof typeof attendanceTypePriority;
				return attendanceTypePriority[b] - attendanceTypePriority[a];
			},
		},
		{
			accessorKey: "hasOffering",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					お供物
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const value = row.getValue("hasOffering") as boolean;
				return (
					<Badge variant={value ? "default" : "secondary"}>
						{offeringMap[String(value) as keyof typeof offeringMap]}
					</Badge>
				);
			},
			sortingFn: (rowA: Row<Entry>, rowB: Row<Entry>) => {
				const a = rowA.getValue("hasOffering") as boolean;
				const b = rowB.getValue("hasOffering") as boolean;
				return (
					offeringPriority[String(b) as keyof typeof offeringPriority] -
					offeringPriority[String(a) as keyof typeof offeringPriority]
				);
			},
			size: 120,
		},
		{
			accessorKey: "returnStatus",
			header: ({ column }: { column: Column<Entry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					返礼状況
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Entry> }) => {
				const status = row.getValue("returnStatus") as ReturnStatus;
				return <StatusBadge status={status} useCustomColors={true} />;
			},
			sortingFn: (rowA: Row<Entry>, rowB: Row<Entry>) => {
				const a = rowA.getValue("returnStatus") as keyof typeof returnStatusPriority;
				const b = rowB.getValue("returnStatus") as keyof typeof returnStatusPriority;
				return returnStatusPriority[b] - returnStatusPriority[a];
			},
			size: 120,
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<Entry> }) => formatCell(row.getValue("notes")),
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }: { row: Row<Entry> }) => {
				const entry = row.original;
				const hasPermission = permission === "owner" || permission === "editor";

				if (!hasPermission) {
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
							{canEdit && (
								<>
									<DropdownMenuItem asChild>
										<EntryDialog
											koudenId={koudenId}
											relationships={relationships}
											defaultValues={entry}
											variant="edit"
										/>
									</DropdownMenuItem>

									<DropdownMenuItem asChild>
										<button
											type="button"
											onClick={() => onDeleteRows([entry.id])}
											className="text-destructive w-full justify-start"
										>
											<Trash2 className="h-4 w-4" />
											削除する
										</button>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
