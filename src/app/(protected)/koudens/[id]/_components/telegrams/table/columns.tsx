import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	ArrowUpDown,
	Pencil,
	Trash2,
	MoreHorizontal,
	Copy,
} from "lucide-react";
import type { KoudenPermission } from "@/app/_actions/koudens";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { Telegram } from "@/types/telegram";
import type { KoudenEntry } from "@/types/kouden";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EditableColumnConfig } from "@/components/custom/data-table/types";

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	senderName: "差出人",
	senderOrganization: "所属",
	senderPosition: "役職",
	koudenEntry: "関連する香典",
	message: "メッセージ",
	notes: "備考",
	actions: "操作",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "senderName", label: "差出人" },
	{ value: "senderOrganization", label: "所属" },
	{ value: "message", label: "メッセージ" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "createdAt_desc", label: "新しい順" },
	{ value: "createdAt_asc", label: "古い順" },
	{ value: "senderName_asc", label: "差出人名順" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	senderPosition: false,
	notes: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	senderOrganization: false,
	message: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	senderName: { type: "text" },
	senderOrganization: { type: "text" },
	senderPosition: { type: "text" },
	message: { type: "text" },
	notes: { type: "text" },
	// 編集不可のカラム
	select: { type: "readonly" },
	koudenEntry: { type: "readonly" },
	actions: { type: "readonly" },
};

interface ColumnProps {
	onEditRow: (telegram: Telegram) => void;
	onDeleteRows: (ids: string[]) => void;
	selectedRows: string[];
	permission?: KoudenPermission;
	koudenEntries: KoudenEntry[];
}

export function createColumns({
	onEditRow,
	onDeleteRows,
	selectedRows,
	permission,
	koudenEntries,
}: ColumnProps) {
	const canEdit = permission === "owner" || permission === "editor";

	const getEntryName = (entryId: string | null | undefined) => {
		if (!entryId) return "-";
		const entry = koudenEntries.find((entry) => entry.id === entryId);
		return entry ? entry.name : "-";
	};

	return [
		{
			id: "select",
			header: ({ table }: { table: Table<Telegram> }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="全選択"
				/>
			),
			cell: ({ row }: { row: Row<Telegram> }) => (
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
			accessorKey: "senderName",
			header: ({ column }: { column: Column<Telegram> }) => (
				<Button
					variant="ghost"
					className="hover:bg-transparent"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					差出人
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }: { row: Row<Telegram> }) =>
				row.getValue("senderName") || "-",
		},
		{
			accessorKey: "senderOrganization",
			header: "所属",
			cell: ({ row }: { row: Row<Telegram> }) =>
				row.getValue("senderOrganization") || "-",
		},
		{
			accessorKey: "senderPosition",
			header: "役職",
			cell: ({ row }: { row: Row<Telegram> }) =>
				row.getValue("senderPosition") || "-",
		},
		{
			accessorKey: "koudenEntryId",
			header: "関連する香典",
			cell: ({ row }: { row: Row<Telegram> }) =>
				getEntryName(row.getValue("koudenEntryId")),
		},
		{
			accessorKey: "message",
			header: "メッセージ",
			cell: ({ row }: { row: Row<Telegram> }) => row.getValue("message") || "-",
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<Telegram> }) => row.getValue("notes") || "-",
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const telegram = row.original;
				const isSelected = selectedRows.includes(telegram.id);

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
									<DropdownMenuItem onClick={() => onEditRow(telegram)}>
										<Pencil className="h-4 w-4 mr-2" />
										編集
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => navigator.clipboard.writeText(telegram.id)}
									>
										<Copy className="h-4 w-4 mr-2" />
										IDをコピー
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => onDeleteRows([telegram.id])}
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
									onClick={() => navigator.clipboard.writeText(telegram.id)}
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
