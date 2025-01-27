import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KoudenPermission } from "@/types/role";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { KoudenEntry, Relationship } from "@/types/kouden";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EditableColumnConfig } from "@/components/custom/data-table/types";
import { formatCurrency, formatPostalCode } from "@/lib/utils";
import { RelationshipSkeleton } from "./relationship-skeleton";
import { SelectCell } from "@/components/custom/data-table/select-cell";
import type { CellValue } from "@/components/custom/data-table/types";

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
	onEditRow: (entry: KoudenEntry) => void;
	onDeleteRows: (ids: string[]) => void;
	onCellUpdate: (
		id: string,
		field: keyof Omit<KoudenEntry, "relationship">,
		value: string | number | boolean | null,
	) => void;
	onCellEdit: (
		columnId: string,
		rowId: string,
		value: CellValue,
	) => Promise<void>;
	selectedRows: string[];
	relationships: Relationship[];
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
		getOptions: (relationships: Relationship[]) => {
			console.log("Getting relationship options:", relationships);
			return relationships.map((rel) => ({
				value: rel.id,
				label: rel.name,
			}));
		},
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
	onCellUpdate,
	onCellEdit,
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
			header: ({ table }: { table: Table<KoudenEntry> }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="全選択"
				/>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => (
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
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					作成日時
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
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
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご芳名
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("name")),
		},
		{
			accessorKey: "organization",
			header: "団体名",
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("organization")),
		},
		{
			accessorKey: "position",
			header: "役職",
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("position")),
		},
		{
			accessorKey: "relationship_id",
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ご関係
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
				if (isLoadingRelationships) {
					return <RelationshipSkeleton />;
				}

				const relationshipId = row.getValue("relationship_id") as string;
				const relationship = relationships.find((r) => r.id === relationshipId);

				// 編集可能な場合はSelectCellを表示
				if (canEdit) {
					const options = relationships.map((rel) => ({
						value: rel.id,
						label: rel.name,
					}));
					console.log("[RelationshipCell] Rendering SelectCell:", {
						rowId: row.original.id,
						relationshipId,
						options,
					});
					return (
						<SelectCell
							value={relationshipId}
							options={options}
							onSave={(value) => {
								console.log("[RelationshipCell] Saving value:", {
									rowId: row.original.id,
									value,
								});
								onCellEdit("relationship_id", row.original.id, value);
							}}
						/>
					);
				}

				// 編集不可の場合は通常のテキスト表示
				return relationship ? relationship.name : relationshipId;
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					金額
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("amount"), "currency"),
		},
		{
			accessorKey: "postal_code",
			header: "郵便番号",
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("postal_code"), "postal_code"),
		},
		{
			accessorKey: "address",
			header: "住所",
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("address")),
		},
		{
			accessorKey: "phone_number",
			header: "電話番号",
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("phone_number")),
		},
		{
			accessorKey: "attendance_type",
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					参列
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
				const value = row.getValue(
					"attendance_type",
				) as keyof typeof attendanceTypeMap;
				return <Badge variant="outline">{attendanceTypeMap[value]}</Badge>;
			},
			sortingFn: (rowA: Row<KoudenEntry>, rowB: Row<KoudenEntry>) => {
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
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					お供物
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
				const value = row.getValue("has_offering") as boolean;
				return value ? "あり" : "なし";
			},
		},
		{
			accessorKey: "is_return_completed",
			header: ({ column }: { column: Column<KoudenEntry> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					返礼
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
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
			cell: ({ row }: { row: Row<KoudenEntry> }) =>
				formatCell(row.getValue("notes")),
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }: { row: Row<KoudenEntry> }) => {
				const entry = row.original;
				const canEdit = permission === "owner" || permission === "editor";
				const canDelete = permission === "owner" || permission === "editor";

				if (!canEdit && !canDelete) {
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
								<DropdownMenuItem
									onClick={() => {
										console.log("Edit button clicked for entry:", entry);
										onEditRow(entry);
									}}
								>
									<Pencil className="mr-2 h-4 w-4" />
									編集
								</DropdownMenuItem>
							)}
							{canDelete && (
								<DropdownMenuItem
									onClick={() => onDeleteRows([entry.id])}
									className="text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									削除
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}
