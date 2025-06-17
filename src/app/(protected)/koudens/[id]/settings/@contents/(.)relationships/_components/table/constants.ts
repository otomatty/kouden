import type { EditableColumnConfig } from "@/types/data-table/table";

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	name: "名称",
	description: "説明",
	is_default: "デフォルト",
	actions: "操作",
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	name: { type: "text" },
	description: { type: "text" },
	is_default: { type: "boolean", options: ["true", "false"] },
	actions: { type: "readonly" },
};
