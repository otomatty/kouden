import type { EditableColumnConfig } from "@/types/table";

// ステータスのマッピング
export const statusMap = {
	preparing: "準備中",
	pending: "未返礼",
	completed: "返礼済み",
} as const;

// カスタムソート用の優先順位マップ
export const statusPriority = {
	completed: 3,
	pending: 2,
	preparing: 1,
} as const;

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	createdAt: "登録日時",
	items: "返礼品",
	quantity: "数量",
	amount: "金額",
	deliveryMethod: "配送方法",
	shippingFee: "配送料",
	scheduledDate: "予定日",
	completedDate: "完了日",
	status: "状態",
	notes: "備考",
	actions: "操作",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "items", label: "返礼品" },
	{ value: "deliveryMethod", label: "配送方法" },
	{ value: "notes", label: "備考" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "amount_desc", label: "金額が高い順" },
	{ value: "amount_asc", label: "金額が低い順" },
	{ value: "status_desc", label: "状態順" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	createdAt: false,
	notes: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	shippingFee: false,
	scheduledDate: false,
	completedDate: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	status: {
		type: "select",
		options: [
			{ value: "preparing", label: "準備中" },
			{ value: "pending", label: "未返礼" },
			{ value: "completed", label: "返礼済み" },
		],
	},
	shippingFee: { type: "number", format: "currency" },
	scheduledDate: { type: "date" },
	completedDate: { type: "date" },
	notes: { type: "text" },
	// 編集不可のカラム
	select: { type: "readonly" },
	createdAt: { type: "readonly" },
	items: { type: "readonly" },
	quantity: { type: "readonly" },
	amount: { type: "readonly" },
	deliveryMethod: { type: "readonly" },
	actions: { type: "readonly" },
};
