import type { EditableColumnConfig } from "@/types/table";

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	name: "返礼品名",
	description: "説明",
	price: "価格",
	actions: "操作",
} as const;

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	name: { type: "text" },
	description: { type: "text" },
	price: { type: "number" },
	actions: { type: "readonly" },
};
