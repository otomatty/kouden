import Image from "next/image";
// ui
import { ArrowUpDown, Trash2, MoreHorizontal, ImageIcon, Users, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SelectionColumn } from "@/components/custom/data-table/selection-column";

// types
import type { KoudenPermission } from "@/types/role";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { Entry } from "@/types/entries";
import type { OfferingType, OfferingWithKoudenEntries } from "@/types/offerings";
import type { CellValue } from "@/types/data-table/table";
// utils
import { formatCurrency } from "@/utils/currency";
// components
import { OfferingDialog } from "../dialog/offering-dialog";
import { OfferingAllocationDialog } from "@/components/custom/OfferingAllocationDialog";
// constants
import { typeLabels } from "./constants";

interface ColumnProps {
	koudenId: string;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	permission?: KoudenPermission;
	entries: Entry[];
}

export function createColumns({ onDeleteRows, permission, koudenId, entries }: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	// セルのフォーマット
	const formatCell = (
		value: CellValue,
		format?: "currency" | "quantity" | "type" | "default",
	): string => {
		if (value == null) return "-";

		try {
			switch (format) {
				case "currency":
					return `${formatCurrency(value as number)}`;
				case "quantity":
					return `${value}点`;
				case "type": // お供物の種別のフォーマット
					return typeLabels[value as OfferingType];

				default:
					return String(value);
			}
		} catch (error) {
			console.error(error);
			return "-";
		}
	};

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<OfferingWithKoudenEntries> }) => (
				<SelectionColumn table={table} permission={permission} />
			),
			cell: ({
				row,
				table,
			}: { row: Row<OfferingWithKoudenEntries>; table: Table<OfferingWithKoudenEntries> }) => (
				<SelectionColumn table={table} row={row} permission={permission} />
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "type",
			header: ({ column }: { column: Column<OfferingWithKoudenEntries> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					種類
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const value = row.getValue("type") as OfferingType;
				return formatCell(value);
			},
		},
		{
			accessorKey: "providerName",
			header: ({ column }: { column: Column<OfferingWithKoudenEntries> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					提供者名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				return row.getValue("providerName");
			},
		},
		{
			accessorKey: "description",
			header: "内容",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const quantity = row.original.quantity;
				const description = row.getValue("description") as string | null;
				return (
					<div className="flex items-center gap-2">
						<span>{description || "-"}</span>
						<Badge variant="secondary">{quantity}点</Badge>
					</div>
				);
			},
		},
		{
			accessorKey: "price",
			header: ({ column }: { column: Column<OfferingWithKoudenEntries> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const price = row.getValue("price") as number | null;
				return formatCell(price, "currency");
			},
		},
		{
			accessorKey: "offeringEntries",
			id: "entries",
			header: "関連する香典情報",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				// 1. 必要なデータの取得
				const offeringEntries = row.original.offeringEntries || [];
				const relatedEntries = offeringEntries.map((oe) => oe.koudenEntry).filter(Boolean);

				// 2. entriesの存在チェック
				if (!Array.isArray(entries)) {
					return <span className="text-muted-foreground">読み込み中...</span>;
				}

				// 3. 表示内容の決定
				if (relatedEntries.length === 0) {
					return <span className="text-muted-foreground">なし</span>;
				}

				// 5. 香典情報の表示
				return (
					<div className="flex flex-wrap gap-1">
						{relatedEntries.map((entry) => {
							if (!entry) return null;

							// 表示名の決定（優先順位: 個人名 > 組織名+役職 > 組織名）
							const displayName =
								entry.name || (entry.organization ? `${entry.organization}` : "名前なし");

							// ツールチップの内容を構築
							const tooltipContent = [
								entry.name && `ご芳名: ${entry.name}`,
								entry.organization && `所属: ${entry.organization}`,
								`金額: ${formatCurrency(entry.amount)}`,
							]
								.filter(Boolean)
								.join("\n");

							return (
								<Tooltip key={entry.id}>
									<TooltipTrigger asChild>
										<Badge variant="secondary" className="cursor-help">
											{displayName}
										</Badge>
									</TooltipTrigger>
									<TooltipContent>
										<p className="whitespace-pre-line text-sm">{tooltipContent}</p>
									</TooltipContent>
								</Tooltip>
							);
						})}
					</div>
				);
			},
		},
		{
			accessorKey: "quantity",
			header: "数量",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const quantity = row.getValue("quantity") as number;
				return <Badge variant="secondary">{quantity}点</Badge>;
			},
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => row.getValue("notes") || "-",
		},
		{
			accessorKey: "offeringPhotos",
			header: "写真",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const photos = row.original.offeringPhotos || [];

				if (photos.length === 0) {
					return (
						<div className="flex items-center gap-2 text-muted-foreground">
							<ImageIcon className="h-4 w-4" />
							<span className="text-sm">なし</span>
						</div>
					);
				}

				return (
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="relative h-8 w-8 rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
						>
							<Image
								src={`/api/storage/${photos[0]?.storage_key}`}
								alt={photos[0]?.caption || "写真"}
								className="object-cover"
								fill
								sizes="32px"
							/>
						</button>
						<Badge variant="secondary">{photos.length}枚</Badge>
					</div>
				);
			},
		},
		{
			id: "allocation",
			header: "配分管理",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const offering = row.original;
				const hasPermission = permission === "owner" || permission === "editor";

				// 価格が設定されていない場合は配分管理を無効化
				if (!offering.price || offering.price <= 0) {
					return <div className="text-muted-foreground text-sm">価格未設定</div>;
				}

				// 編集権限がない場合は表示のみ
				if (!hasPermission) {
					return (
						<Button variant="ghost" size="sm" disabled>
							<Calculator className="h-4 w-4 mr-1" />
							配分確認
						</Button>
					);
				}

				return (
					<OfferingAllocationDialog
						offeringId={offering.id}
						offeringType={typeLabels[offering.type as OfferingType]}
						offeringPrice={offering.price}
						providerName={offering.providerName}
						availableEntries={entries.map((entry) => ({
							id: entry.id,
							name: entry.name || "名前なし",
							amount: entry.amount,
							organization: entry.organization || undefined,
						}))}
					>
						<Button variant="outline" size="sm">
							<Users className="h-4 w-4 mr-1" />
							配分管理
						</Button>
					</OfferingAllocationDialog>
				);
			},
			size: 160,
		},
		{
			id: "actions",
			cell: ({ row }: { row: Row<OfferingWithKoudenEntries> }) => {
				const offering = row.original;
				const hasPermission = permission === "owner" || permission === "editor";

				if (!hasPermission) {
					return null;
				}

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">メニューを開く</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{canEdit && (
								<>
									<DropdownMenuItem asChild>
										<OfferingDialog
											koudenId={koudenId}
											entries={entries}
											defaultValues={offering}
											variant="edit"
										/>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Button
											variant="ghost"
											onClick={() => onDeleteRows([offering.id])}
											className="text-destructive w-full justify-start hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
											削除する
										</Button>
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
