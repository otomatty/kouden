// 型定義の追加
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	OnChangeFn,
} from "@tanstack/react-table";
import type { SelectOption } from "./additional-select";

export type CellType =
	| "text"
	| "number"
	| "select"
	| "checkbox"
	| "boolean"
	| "postal_code"
	| "readonly"
	| "date"
	| "searchable-selector"
	| "additional-select";

export interface SearchableSelectorItem {
	id: string;
	name: string | null;
	organization?: string | null;
	position?: string | null;
	amount?: number | null;
	notes?: string | null;
}

export type EditableColumnConfig =
	| {
			type: "text" | "date" | "postal_code" | "readonly";
			options?: never;
	  }
	| {
			type: "number";
			format?: "currency" | "postal_code";
			options?: never;
	  }
	| {
			type: "select" | "boolean";
			options: string[];
	  }
	| {
			type: "additional-select";
			options: SelectOption[];
			addOptionPlaceholder?: string;
			onAddOption?: (option: SelectOption, rowId?: string) => Promise<string>;
	  }
	| {
			type: "searchable-selector";
			selectorItems: SearchableSelectorItem[];
			selectorConfig?: {
				title?: string;
				description?: string;
				searchPlaceholder?: string;
			};
	  };

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
