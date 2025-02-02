import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, MoreHorizontal, Trash } from "lucide-react";
import type { KoudenPermission } from "@/types/role";
import type { Table, Row, Column } from "@tanstack/react-table";
import type { Telegram } from "@/types/telegram";
import type { Entry } from "@/types/entries";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectCell } from "@/components/custom/data-table/select-cell";
import { EditableCell } from "@/components/custom/data-table/editable-cell";
import { SearchableSelectorDialog } from "@/components/custom/searchable-selector-dialog";
import type { EditableColumnConfig } from "@/types/table";
import type { CellValue } from "@/types/table";

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	senderName: "差出人",
	senderOrganization: "所属",
	senderPosition: "役職",
	koudenEntryId: "関連する香典",
	message: "メッセージ",
	notes: "備考",
	createdAt: "作成日時",
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
	createdAt: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	senderOrganization: false,
	message: false,
	createdAt: false,
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

interface ColumnsProps {
	entries: Entry[];
	onEditRow: (telegram: Telegram) => Promise<void>;
	onDeleteRows: (ids: string[]) => Promise<void>;
	onCellEdit: (columnId: string, rowId: string, value: CellValue) => Promise<void>;
	selectedRows: string[];
	permission?: KoudenPermission;
}

export function createColumns({
	onEditRow,
	onDeleteRows,
	onCellEdit,
	entries,
	permission,
}: ColumnsProps) {
	const canEdit = permission === "owner" || permission === "editor";

	const getEntryName = (entryId: string | null | undefined) => {
		if (!entryId) return "-";
		const entry = entries.find((entry) => entry.id === entryId);
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
			cell: ({ row }: { row: Row<Telegram> }) => {
				const value = row.getValue("senderName") as string;

				if (canEdit) {
					return (
						<EditableCell
							value={value}
							onSave={(newValue) => {
								onCellEdit("senderName", row.original.id, newValue);
							}}
						/>
					);
				}

				return value || "-";
			},
		},
		{
			accessorKey: "senderOrganization",
			header: "団体名",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const value = row.getValue("senderOrganization") as string;

				if (canEdit) {
					return (
						<EditableCell
							value={value}
							onSave={(newValue) => {
								onCellEdit("senderOrganization", row.original.id, newValue);
							}}
						/>
					);
				}

				return value || "-";
			},
		},
		{
			accessorKey: "senderPosition",
			header: "役職",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const value = row.getValue("senderPosition") as string;

				if (canEdit) {
					return (
						<EditableCell
							value={value}
							onSave={(newValue) => {
								onCellEdit("senderPosition", row.original.id, newValue);
							}}
						/>
					);
				}

				return value || "-";
			},
		},
		{
			accessorKey: "koudenEntryId",
			header: "関連する香典",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const value = row.getValue("koudenEntryId") as string;
				const currentName = getEntryName(value);

				if (canEdit) {
					return (
						<SearchableSelectorDialog
							items={entries.map((entry) => ({
								id: entry.id,
								name: entry.name,
								organization: entry.organization,
								position: entry.position,
								amount: entry.amount,
								notes: entry.notes,
							}))}
							selectedIds={value ? [value] : []}
							onSelectionChange={(ids) => {
								onCellEdit("koudenEntryId", row.original.id, ids[0] || null);
							}}
							trigger={
								<button className="w-full text-left px-2 py-1 hover:bg-accent" type="button">
									{currentName}
								</button>
							}
						/>
					);
				}

				return currentName;
			},
		},
		{
			accessorKey: "message",
			header: "メッセージ",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const value = row.getValue("message") as string;

				if (canEdit) {
					return (
						<EditableCell
							value={value}
							onSave={(newValue) => {
								onCellEdit("message", row.original.id, newValue);
							}}
						/>
					);
				}

				return value || "-";
			},
		},
		{
			accessorKey: "notes",
			header: "備考",
			cell: ({ row }: { row: Row<Telegram> }) => row.getValue("notes") || "-",
		},
		{
			accessorKey: "createdAt",
			header: "作成日時",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const date = row.getValue("createdAt");
				if (!date) return "-";
				return new Date(date as string).toLocaleString("ja-JP");
			},
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }: { row: Row<Telegram> }) => {
				const telegram = row.original;
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
							{hasPermission && (
								<DropdownMenuItem
									onClick={() => {
										onEditRow(telegram);
									}}
								>
									<Pencil className="mr-2 h-4 w-4" />
									編集
								</DropdownMenuItem>
							)}
							{hasPermission && (
								<DropdownMenuItem
									onClick={() => {
										onDeleteRows([telegram.id]);
									}}
									className="text-destructive"
								>
									<Trash className="mr-2 h-4 w-4" />
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
