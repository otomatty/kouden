"use client";

// types
import type { ReturnManagementSummary } from "@/types/return-records/return-records";
import type { Relationship } from "@/types/relationships";
import type { Entry } from "@/types/entries";
// components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ArrowUpDown,
	MoreHorizontal,
	Eye,
	Pen,
	Trash,
	MapPin,
	Phone,
	DollarSign,
} from "lucide-react";
import { SelectionColumn } from "@/components/custom/data-table/selection-column";

// types
import type { KoudenPermission } from "@/types/role";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { CellValue } from "@/types/table";
// utils
import { formatCurrency } from "@/utils/currency";
// components
import { ReturnDialog } from "../dialog/return-dialog";
// constants
import { returnStatusMap, returnStatusBadgeVariant } from "./constants";

interface ColumnProps {
	koudenId: string;
	entries: Entry[];
	relationships: Relationship[];
	onDeleteRows: (ids: string[]) => void;
	onEditReturn?: (returnRecord: ReturnManagementSummary) => void;
	permission?: KoudenPermission;
}

/**
 * データテーブルのカラム定義
 */
export function createColumns({
	koudenId,
	entries,
	relationships,
	onDeleteRows,
	onEditReturn,
	permission,
}: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";
	const canDelete = permission === "owner";

	// セルのフォーマット
	type FormatType = "currency" | "date" | "status" | "profit_loss" | "default";

	const formatCell = (value: CellValue, format?: FormatType): string => {
		if (value == null) return "-";

		try {
			switch (format) {
				case "currency":
					return formatCurrency(Number(value));
				case "date":
					return new Date(String(value)).toLocaleString("ja-JP", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					});
				case "status":
					return returnStatusMap[value as keyof typeof returnStatusMap] ?? String(value);
				case "profit_loss": {
					const amount = Number(value);
					return amount >= 0 ? `+${formatCurrency(amount)}` : formatCurrency(amount);
				}
				default:
					return String(value) || "-";
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

	// 損益の表示色を取得
	const getProfitLossVariant = (amount: number) => {
		if (amount > 0) return "default"; // 黒字
		if (amount < 0) return "destructive"; // 赤字
		return "secondary"; // 収支ゼロ
	};

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<ReturnManagementSummary> }) => (
				<SelectionColumn table={table} permission={permission} />
			),
			cell: ({
				row,
				table,
			}: { row: Row<ReturnManagementSummary>; table: Table<ReturnManagementSummary> }) => (
				<SelectionColumn table={table} row={row} permission={permission} />
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "returnRecordCreated",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					登録日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("returnRecordCreated") as string;
				return formatCell(value, "date");
			},
		},
		{
			accessorKey: "entryName",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					名前
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const returnRecord = row.original;
				return (
					<div>
						{returnRecord.organization && (
							<div className="text-sm text-muted-foreground">{returnRecord.organization}</div>
						)}
						{returnRecord.entryPosition && (
							<div className="text-xs text-muted-foreground">{returnRecord.entryPosition}</div>
						)}
						<div className="font-medium">{returnRecord.entryName}</div>
					</div>
				);
			},
		},
		{
			accessorKey: "organization",
			header: "組織",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("organization") as string;
				return formatCell(value);
			},
		},
		{
			accessorKey: "entryPosition",
			header: "役職",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("entryPosition") as string;
				return formatCell(value);
			},
		},
		{
			accessorKey: "relationshipName",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					関係性
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("relationshipName") as string;
				return formatCell(value);
			},
		},
		{
			accessorKey: "koudenAmount",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					香典金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("koudenAmount") as number;
				return formatCell(value, "currency");
			},
		},
		{
			accessorKey: "offeringTotal",
			header: "供物金額",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("offeringTotal") as number;
				return value > 0 ? formatCell(value, "currency") : "-";
			},
		},
		{
			accessorKey: "totalAmount",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					合計金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("totalAmount") as number;
				return <div className="font-medium">{formatCell(value, "currency")}</div>;
			},
		},
		{
			accessorKey: "returnStatus",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					返礼ステータス
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const status = row.getValue("returnStatus") as keyof typeof returnStatusMap;
				const variant = returnStatusBadgeVariant[status] || "outline";

				return (
					<Badge variant={variant as "outline" | "secondary" | "default" | "destructive"}>
						{returnStatusMap[status] || status}
					</Badge>
				);
			},
		},
		{
			accessorKey: "funeralGiftAmount",
			header: "葬儀ギフト金額",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("funeralGiftAmount") as number;
				return value > 0 ? formatCell(value, "currency") : "-";
			},
		},
		{
			accessorKey: "additionalReturnAmount",
			header: "追加返礼金額",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("additionalReturnAmount") as number;
				return value > 0 ? formatCell(value, "currency") : "-";
			},
		},
		{
			accessorKey: "returnMethod",
			header: "返礼方法",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("returnMethod") as string;
				return formatCell(value);
			},
		},
		{
			accessorKey: "returnItems",
			header: "返礼品",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const items = row.getValue("returnItems") as Array<{
					name: string;
					quantity: number;
					price?: number;
					notes?: string;
				}>;
				if (!items || items.length === 0) return "-";

				return (
					<div className="max-w-[200px]">
						{items.slice(0, 2).map((item) => (
							<div key={`${item.name}-${item.quantity}`} className="text-sm">
								{item.name} x{item.quantity}
							</div>
						))}
						{items.length > 2 && (
							<div className="text-xs text-muted-foreground">他{items.length - 2}件</div>
						)}
					</div>
				);
			},
			enableSorting: false,
		},
		{
			accessorKey: "returnItemsCost",
			header: "返礼品費用",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("returnItemsCost") as number;
				return value > 0 ? formatCell(value, "currency") : "-";
			},
		},
		{
			accessorKey: "profitLoss",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					<DollarSign className="mr-2 h-4 w-4" />
					損益
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("profitLoss") as number;
				const variant = getProfitLossVariant(value);

				return (
					<Badge variant={variant as "outline" | "secondary" | "default" | "destructive"}>
						{formatCell(value, "profit_loss")}
					</Badge>
				);
			},
		},
		{
			accessorKey: "shippingInfo",
			header: ({ column }: { column: Column<ReturnManagementSummary> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					<MapPin className="mr-2 h-4 w-4" />
					発送先
				</Button>
			),
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const returnRecord = row.original;
				const { shippingPostalCode, shippingAddress, shippingPhoneNumber } = returnRecord;

				const hasShippingInfo = shippingAddress || shippingPostalCode || shippingPhoneNumber;
				if (!hasShippingInfo) {
					return <div className="text-muted-foreground">-</div>;
				}

				return (
					<div className="max-w-[200px] space-y-1">
						{shippingPostalCode && (
							<div className="text-xs text-muted-foreground">〒{shippingPostalCode}</div>
						)}
						{shippingAddress && <div className="text-sm">{shippingAddress}</div>}
						{shippingPhoneNumber && (
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Phone className="h-3 w-3" />
								{shippingPhoneNumber}
							</div>
						)}
					</div>
				);
			},
			enableSorting: false,
		},
		{
			accessorKey: "arrangementDate",
			header: "手配日",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("arrangementDate") as string;
				return value ? formatCell(value, "date") : "-";
			},
		},
		{
			accessorKey: "returnRecordUpdated",
			header: "更新日時",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("returnRecordUpdated") as string;
				return formatCell(value, "date");
			},
		},
		{
			accessorKey: "remarks",
			header: "備考",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const value = row.getValue("remarks") as string;
				return value ? (
					<div className="max-w-[200px] truncate" title={value}>
						{value}
					</div>
				) : (
					"-"
				);
			},
			enableSorting: false,
		},
		{
			id: "actions",
			header: "アクション",
			cell: ({ row }: { row: Row<ReturnManagementSummary> }) => {
				const returnRecord = row.original;

				const handleViewDetails = () => {
					console.log("詳細表示:", returnRecord);
				};

				const handleEdit = () => {
					onEditReturn?.(returnRecord);
				};

				const handleDelete = () => {
					if (canDelete) {
						onDeleteRows([returnRecord.koudenEntryId]);
					}
				};

				return (
					<div className="flex items-center gap-2">
						{canEdit && (
							<ReturnDialog
								koudenId={koudenId}
								entries={entries}
								relationships={relationships}
								defaultValues={returnRecord}
								variant="edit"
								trigger={
									<Button variant="ghost" size="sm">
										<Pen className="h-4 w-4" />
									</Button>
								}
							/>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">メニューを開く</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleViewDetails}>
									<Eye className="mr-2 h-4 w-4" />
									詳細表示
								</DropdownMenuItem>
								{canEdit && (
									<DropdownMenuItem onClick={handleEdit}>
										<Pen className="mr-2 h-4 w-4" />
										編集
									</DropdownMenuItem>
								)}
								{canDelete && (
									<DropdownMenuItem onClick={handleDelete} className="text-destructive">
										<Trash className="mr-2 h-4 w-4" />
										削除
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
			enableSorting: false,
			enableHiding: false,
		},
	];
}
