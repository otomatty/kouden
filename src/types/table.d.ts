// 型定義の追加
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	OnChangeFn,
} from "@tanstack/react-table";
import type { Relationship } from "@/types/relationships";

export type CellType =
	| "text"
	| "number"
	| "select"
	| "checkbox"
	| "boolean"
	| "postal_code"
	| "readonly"
	| "searchable-selector";

export interface SelectOption {
	value: string;
	label: string;
}

export interface SearchableSelectorItem {
	id: string;
	name: string | null;
	organization?: string | null;
	position?: string | null;
	amount?: number | null;
	notes?: string | null;
}

export interface EditableColumnConfig {
	type: CellType;
	options?: SelectOption[]; // select型の場合の選択肢
	format?: "currency" | "postal_code"; // 表示フォーマット
	getOptions?: (data: Relationship[]) => SelectOption[]; // 動的な選択肢の生成
	selectorItems?: SearchableSelectorItem[]; // searchable-selector型の場合の選択可能なアイテム
	selectorConfig?: {
		title?: string;
		description?: string;
		searchPlaceholder?: string;
	};
}

export type CellValue = string | number | boolean | null;

export interface DataTableProperties<Data, Value> {
	columns: ColumnDef<Data, Value>[];
	data: Data[];
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
	onCellEdit?: (columnId: string, rowId: string, newValue: CellValue) => Promise<void>;
	permission: "owner" | "editor" | "viewer";
}
