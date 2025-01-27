import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	OnChangeFn,
} from "@tanstack/react-table";

export type CellType =
	| "text"
	| "number"
	| "select"
	| "checkbox"
	| "boolean"
	| "postal_code"
	| "readonly";

export interface SelectOption {
	value: string;
	label: string;
}

export interface EditableColumnConfig {
	type: CellType;
	options?: SelectOption[]; // select型の場合の選択肢
	format?: "currency" | "postal_code"; // 表示フォーマット
}

export type CellValue = string | number | boolean | null;

export interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	sorting?: SortingState;
	onSortingChange?: OnChangeFn<SortingState>;
	columnFilters?: ColumnFiltersState;
	onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
	columnVisibility?: VisibilityState;
	onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
	rowSelection?: Record<string, boolean>;
	onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
	emptyMessage?: string;
	headerClassName?: string;
	bodyClassName?: string;
	cellClassName?: string;
	editableColumns?: Record<string, EditableColumnConfig>;
	onCellEdit?: (
		columnId: string,
		rowId: string,
		newValue: CellValue,
	) => Promise<void>;
	permission: "owner" | "editor" | "viewer";
}
