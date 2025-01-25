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
import type { KoudenEntryTableData } from "../types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EditableColumnConfig } from "@/components/custom/data-table/types";
import { formatCurrency, formatPostalCode } from "@/lib/utils";
import { RelationshipSkeleton } from "./relationship-skeleton";

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

const attendanceTypeOptions = [
	{ value: "FUNERAL", label: "葬儀" },
	{ value: "CONDOLENCE_VISIT", label: "弔問" },
	{ value: "ABSENT", label: "欠席" },
];

const offeringOptions = [
	{ value: "true", label: "あり" },
	{ value: "false", label: "なし" },
];

interface ColumnProps {
	onEditRow: (entry: KoudenEntryTableData) => void;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	relationships: Array<{
		id: string;
		name: string;
		description?: string;
	}>;
	permission?: KoudenPermission;
	koudenId: string;
	isLoadingRelationships: boolean;
}

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	name: "ご芳名",
	organization: "団体名",
	position: "役職",
	created_at: "登録日時",
	relationship_id: "ご関係",
	amount: "金額",
	postal_code: "郵便番号",
	address: "住所",
	phone_number: "電話番号",
	attendance_type: "参列",
	has_offering: "供物",
	is_return_completed: "返礼",
	notes: "備考",
	actions: "アクション",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "name", label: "ご芳名" },
	{ value: "address", label: "住所" },
	{ value: "organization", label: "団体名" },
	{ value: "position", label: "役職" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "amount_desc", label: "金額が高い順" },
	{ value: "amount_asc", label: "金額が低い順" },
	{ value: "name_asc", label: "名前順" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	position: false,
	phone_number: false,
	attendance_type: false,
	is_return_completed: false,
	created_at: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	organization: false,
	postal_code: false,
	address: false,
	notes: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	name: { type: "text" },
	organization: { type: "text" },
	position: { type: "text" },
	amount: { type: "number", format: "currency" },
	postal_code: { type: "postal_code" },
	address: { type: "text" },
	phone_number: { type: "text" },
	relationship_id: {
		type: "select",
		options: [], // 動的に設定されるため、空配列をデフォルトとする
	},
	attendance_type: {
		type: "select",
		options: [
			{ value: "FUNERAL", label: "葬儀" },
			{ value: "CONDOLENCE_VISIT", label: "弔問" },
			{ value: "ABSENT", label: "香典のみ" },
		],
	},
	has_offering: {
		type: "boolean",
		options: [
			{ value: "true", label: "あり" },
			{ value: "false", label: "なし" },
		],
	},
	is_return_completed: {
		type: "boolean",
		options: [
			{ value: "true", label: "返礼済み" },
			{ value: "false", label: "未返礼" },
		],
	},
	notes: { type: "text" },
	// 編集不可のカラム
	select: { type: "readonly" },
	actions: { type: "readonly" },
	created_at: { type: "readonly" },
};

export function createColumns({
	onEditRow,
	onDeleteRows,
	selectedRows,
	relationships,
	permission,
	koudenId,
	isLoadingRelationships,
}: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	const formatCell = (
		value: string | number | boolean | null | undefined,
		format?: "currency" | "postal_code",
	) => {
		if (value == null) return "";
		if (format === "currency") {
			return `¥${formatCurrency(value as number)}`;
		}
		if (format === "postal_code") {
			return `〒${formatPostalCode(value as string)}`;
		}
		return String(value);
	};

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
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご芳名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("name")),
		},
		{
			accessorKey: "organization",
			header: "団体名",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("organization")),
		},
		{
			accessorKey: "position",
			header: "役職",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("position")),
		},
		{
			accessorKey: "relationship_id",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご関係
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				if (isLoadingRelationships) {
					return <RelationshipSkeleton />;
				}
				const relationship = relationships.find(
					(rel) => rel.id === row.getValue("relationship_id"),
				);
				return relationship ? (
					<Badge variant="outline" className="font-normal">
						{relationship.name}
					</Badge>
				) : null;
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("amount"), "currency"),
		},
		{
			accessorKey: "postal_code",
			header: "郵便番号",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("postal_code"), "postal_code"),
		},
		{
			accessorKey: "address",
			header: "住所",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("address")),
		},
		{
			accessorKey: "phone_number",
			header: "電話番号",
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("phone_number")),
		},
		{
			accessorKey: "attendance_type",
			header: ({ column }: { column: Column<KoudenEntryTableData> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					参列
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) => {
				const value = row.getValue(
					"attendance_type",
				) as keyof typeof attendanceTypeMap;
				return <Badge variant="outline">{attendanceTypeMap[value]}</Badge>;
			},
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
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					お供物
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
					className="hover:bg-transparent"
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
			cell: ({ row }: { row: Row<KoudenEntryTableData> }) =>
				formatCell(row.getValue("notes")),
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
									<DropdownMenuItem onClick={() => onEditRow(row.original)}>
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
