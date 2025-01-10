import { createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
	TextCell,
	NumberCell,
	SelectCell,
	PopoverTextCell,
} from "./cell-components";
import type { SpreadsheetData } from "./types";
import { ATTENDANCE_OPTIONS, BOOLEAN_OPTIONS } from "./types";

const columnHelper = createColumnHelper<SpreadsheetData>();

// ヘッダーの最小幅を定義
const MIN_WIDTHS = {
	name: "120px",
	organization: "150px",
	position: "100px",
	relationship: "100px",
	amount: "100px",
	postal_code: "100px",
	address: "200px",
	phone_number: "120px",
	attendance_type: "80px",
	has_offering: "60px",
	notes: "150px",
};

export const createColumns = (
	relationships: Array<{ id: string; name: string }>,
	onRowSelectionChange: (id: string, isSelected: boolean) => void,
	onCellChange: (
		id: string,
		field: keyof SpreadsheetData,
		value: SpreadsheetData[keyof SpreadsheetData],
	) => void,
) => [
	columnHelper.display({
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllRowsSelected()}
				onCheckedChange={(value) => {
					table.toggleAllRowsSelected(!!value);
					for (const row of table.getRowModel().rows) {
						onRowSelectionChange(row.original.id, !!value);
					}
				}}
				aria-label="全選択"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.original.isSelected || false}
				onCheckedChange={(value) =>
					onRowSelectionChange(row.original.id, !!value)
				}
				aria-label="行を選択"
			/>
		),
		enableSorting: false,
	}),
	columnHelper.accessor("name", {
		header: "ご芳名",
		cell: (props) => (
			<TextCell
				{...props}
				minWidth={MIN_WIDTHS.name}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "name", value)
				}
			/>
		),
	}),
	columnHelper.accessor("organization", {
		header: "団体名",
		cell: (props) => (
			<PopoverTextCell
				{...props}
				minWidth={MIN_WIDTHS.organization}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "organization", value)
				}
			/>
		),
	}),
	columnHelper.accessor("position", {
		header: "役職",
		cell: (props) => (
			<PopoverTextCell
				{...props}
				minWidth={MIN_WIDTHS.position}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "position", value)
				}
			/>
		),
	}),
	columnHelper.accessor("relationship", {
		header: "ご関係",
		cell: (props) => (
			<SelectCell
				{...props}
				minWidth={MIN_WIDTHS.relationship}
				options={relationships.map((rel) => ({
					value: rel.name,
					label: rel.name,
				}))}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "relationship", value)
				}
			/>
		),
	}),
	columnHelper.accessor("amount", {
		header: "金額",
		cell: (props) => (
			<NumberCell
				{...props}
				minWidth={MIN_WIDTHS.amount}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "amount", value)
				}
			/>
		),
	}),
	columnHelper.accessor("postal_code", {
		header: "郵便番号",
		cell: (props) => (
			<TextCell
				{...props}
				minWidth={MIN_WIDTHS.postal_code}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "postal_code", value)
				}
			/>
		),
	}),
	columnHelper.accessor("address", {
		header: "住所",
		cell: (props) => (
			<PopoverTextCell
				{...props}
				minWidth={MIN_WIDTHS.address}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "address", value)
				}
			/>
		),
	}),
	columnHelper.accessor("phone_number", {
		header: "電話番号",
		cell: (props) => (
			<TextCell
				{...props}
				minWidth={MIN_WIDTHS.phone_number}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "phone_number", value)
				}
			/>
		),
	}),
	columnHelper.accessor("attendance_type", {
		header: "参列",
		cell: (props) => (
			<SelectCell
				{...props}
				minWidth={MIN_WIDTHS.attendance_type}
				options={ATTENDANCE_OPTIONS.map((option) => ({
					value: option,
					label: option,
				}))}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "attendance_type", value)
				}
			/>
		),
	}),
	columnHelper.accessor("has_offering", {
		header: "供物",
		cell: (props) => (
			<SelectCell
				{...props}
				minWidth={MIN_WIDTHS.has_offering}
				options={BOOLEAN_OPTIONS.map((option) => ({
					value: option,
					label: option,
				}))}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "has_offering", value)
				}
			/>
		),
	}),
	columnHelper.accessor("notes", {
		header: "備考",
		cell: (props) => (
			<TextCell
				{...props}
				minWidth={MIN_WIDTHS.notes}
				onValueChange={(value) =>
					onCellChange(props.row.original.id, "notes", value)
				}
			/>
		),
	}),
];
