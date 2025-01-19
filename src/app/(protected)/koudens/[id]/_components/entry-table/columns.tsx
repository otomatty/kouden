import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	ArrowUpDown,
	Pencil,
	Trash2,
	MoreHorizontal,
	Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KoudenPermission } from "@/app/_actions/koudens";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { KoudenEntryTableData } from "./types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

// カスタムソート用の優先順位マップ
const attendanceTypePriority = {
	FUNERAL: 3,
	CONDOLENCE_VISIT: 2,
	ABSENT: 1,
} as const;

interface ColumnProps {
	onEditRow: (id: string) => void;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	relationships: Array<{
		id: string;
		name: string;
		description?: string;
	}>;
	permission?: KoudenPermission;
}

// 郵便番号のフォーマット関数
function formatPostalCode(value?: string | null): string {
	if (!value) return "";
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length <= 3) return numbers;
	return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
}

export function createColumns({
	onEditRow,
	onDeleteRows,
	selectedRows,
	relationships,
	permission,
}: {
	onEditRow: (id: string) => void;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	relationships: { id: string; name: string; description?: string }[];
	permission: "owner" | "editor" | "viewer" | null;
}) {
	const canEdit = permission === "owner" || permission === "editor";

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<KoudenEntryTableData> }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="全選択"
				/>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="行を選択"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "created_at",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					作成日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
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
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご芳名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "organization",
			header: "団体名",
		},
		{
			accessorKey: "position",
			header: "役職",
		},
		{
			accessorKey: "relationship_id",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご関係
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const relationshipId = row.getValue("relationship_id") as string;
				if (!relationshipId) return "-";

				const relationship = relationships.find((r) => r.id === relationshipId);
				if (!relationship) return "-";

				return relationship.name;
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const amount = row.getValue("amount") as number;
				return (
					<div className="text-right">
						{new Intl.NumberFormat("ja-JP", {
							style: "currency",
							currency: "JPY",
						}).format(amount)}
					</div>
				);
			},
		},
		{
			accessorKey: "postal_code",
			header: "郵便番号",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const postalCode = row.getValue("postal_code") as string | null;
				return formatPostalCode(postalCode);
			},
		},
		{
			accessorKey: "address",
			header: "住所",
		},
		{
			accessorKey: "phone_number",
			header: "電話番号",
		},
		{
			accessorKey: "attendance_type",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					参列
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => (
				<Badge variant="outline">
					{
						attendanceTypeMap[
							row.getValue("attendance_type") as keyof typeof attendanceTypeMap
						]
					}
				</Badge>
			),
			sortingFn: (
				rowA: Row<KoudenEntryTableData>,
				rowB: Row<KoudenEntryTableData>,
			) => {
				const a = rowA.getValue(
					"attendance_type",
				) as keyof typeof attendanceTypePriority;
				const b = rowB.getValue(
					"attendance_type",
				) as keyof typeof attendanceTypePriority;
				return attendanceTypePriority[b] - attendanceTypePriority[a];
			},
		},
		{
			accessorKey: "has_offering",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					供物
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const value = row.getValue("has_offering") as boolean;
				return value ? "あり" : "なし";
			},
		},
		{
			accessorKey: "is_return_completed",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					返礼
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const value = row.getValue("is_return_completed") as boolean;
				return (
					<Badge variant={value ? "default" : "secondary"}>
						{value ? "完了" : "未完了"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "notes",
			header: "備考",
		},
		{
			id: "actions",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const isSelected = selectedRows.includes(row.original.id);

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">メニューを開く</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>アクション</DropdownMenuLabel>
							{canEdit && (
								<>
									<DropdownMenuItem onClick={() => onEditRow(row.original.id)}>
										<Pencil className="h-4 w-4 mr-2" />
										編集
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											navigator.clipboard.writeText(row.original.id)
										}
									>
										<Copy className="h-4 w-4 mr-2" />
										IDをコピー
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => onDeleteRows([row.original.id])}
										disabled={isSelected}
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										削除
									</DropdownMenuItem>
								</>
							)}
							{!canEdit && (
								<DropdownMenuItem
									onClick={() => navigator.clipboard.writeText(row.original.id)}
								>
									<Copy className="h-4 w-4 mr-2" />
									IDをコピー
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
