import type { EditableColumnConfig } from "@/types/table";
import type { SelectColorConfig } from "@/types/select-colors";

// 返礼状況のマッピング
export const returnStatusMap = {
	PENDING: "未対応",
	PARTIAL_RETURNED: "一部返礼",
	COMPLETED: "完了",
	NOT_REQUIRED: "返礼不要",
} as const;

// 返礼状況の優先順位（ソート用）
export const returnStatusPriority = {
	PENDING: 4,
	PARTIAL_RETURNED: 3,
	COMPLETED: 2,
	NOT_REQUIRED: 1,
} as const;

// 返礼状況のバッジ色
export const returnStatusBadgeVariant = {
	PENDING: "outline",
	PARTIAL_RETURNED: "secondary",
	COMPLETED: "default",
	NOT_REQUIRED: "destructive",
} as const;

/**
 * 返礼状況用のカスタム色設定
 * 各プロジェクトで独自の色を設定したい場合はここを変更
 */
export const returnStatusCustomColors: Record<string, SelectColorConfig> = {
	PENDING: {
		background: "hsl(0 0% 0%)", // black-50
		text: "hsl(0 0% 100%)", // white
		border: "hsl(0 0% 0%)", // black-200
		hoverBackground: "hsl(0 0% 0%)",
		hoverText: "hsl(0 0% 100%)",
	},
	PARTIAL_RETURNED: {
		background: "hsl(45.4 93.4% 47.5%)", // yellow-500
		text: "hsl(0 0% 0%)", // black
		border: "hsl(45.4 93.4% 47.5%)",
		hoverBackground: "hsl(47.9 95.8% 53.1%)",
		hoverText: "hsl(0 0% 0%)",
	},
	COMPLETED: {
		background: "hsl(142.1 76.2% 36.3%)", // green-600
		text: "hsl(0 0% 100%)", // white
		border: "hsl(142.1 76.2% 36.3%)",
		hoverBackground: "hsl(142.1 70.6% 45.3%)",
		hoverText: "hsl(0 0% 100%)",
	},
	NOT_REQUIRED: {
		background: "hsl(217.2 91.2% 59.8%)", // blue-500
		text: "hsl(0 0% 100%)", // white
		border: "hsl(217.2 91.2% 59.8%)",
		hoverBackground: "hsl(217.2 91.2% 59.8%)",
		hoverText: "hsl(0 0% 100%)",
	},
};

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	entryName: "名前",
	organization: "組織",
	entryPosition: "役職",
	relationshipName: "関係性",
	koudenAmount: "香典金額",
	offeringTotal: "供物金額",
	totalAmount: "合計金額",
	returnStatus: "返礼状況",
	funeralGiftAmount: "葬儀ギフト金額",
	additionalReturnAmount: "追加返礼金額",
	returnMethod: "返礼方法",
	returnItems: "返礼品",
	returnItemsCost: "返礼品費用",
	profitLoss: "損益",
	shippingInfo: "発送先",
	arrangementDate: "手配日",
	returnRecordCreated: "登録日時",
	returnRecordUpdated: "更新日時",
	remarks: "備考",
	actions: "操作",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "entryName", label: "名前" },
	{ value: "organization", label: "組織" },
	{ value: "entryPosition", label: "役職" },
	{ value: "relationshipName", label: "関係性" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "returnRecordCreatedDesc", label: "新しい順" },
	{ value: "returnRecordCreatedAsc", label: "古い順" },
	{ value: "totalAmountDesc", label: "金額が高い順" },
	{ value: "totalAmountAsc", label: "金額が低い順" },
	{ value: "entryNameAsc", label: "名前順" },
	{ value: "returnStatusAsc", label: "ステータス順" },
];

// フィルターオプションの定義
export const statusFilterOptions = [
	{ value: "all", label: "全て" },
	{ value: "PENDING", label: "未対応" },
	{ value: "PARTIAL_RETURNED", label: "一部返礼" },
	{ value: "COMPLETED", label: "完了" },
	{ value: "NOT_REQUIRED", label: "返礼不要" },
];

export const profitLossFilterOptions = [
	{ value: "all", label: "全て" },
	{ value: "profit", label: "黒字" },
	{ value: "loss", label: "赤字" },
	{ value: "break_even", label: "収支ゼロ" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	organization: false,
	relationshipName: false,
	entryPosition: false,
	offeringTotal: false,
	funeralGiftAmount: false,
	additionalReturnAmount: false,
	returnMethod: false,
	returnItemsCost: false,
	arrangementDate: false,
	returnRecordCreated: false,
	returnRecordUpdated: false,
	shippingInfo: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	organization: false,
	relationshipName: false,
	returnItems: false,
	shippingInfo: false,
	profitLoss: false,
};

export const mobileColumnVisibility = {
	...tabletColumnVisibility,
	koudenAmount: false,
	totalAmount: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	returnStatus: {
		type: "select",
		options: ["PENDING", "PARTIAL_RETURNED", "COMPLETED", "NOT_REQUIRED"],
	},
	funeralGiftAmount: { type: "number", format: "currency" },
	additionalReturnAmount: { type: "number", format: "currency" },
	returnMethod: { type: "text" },
	arrangementDate: { type: "date" },
	remarks: { type: "text" },
	// 編集不可のカラム
	select: { type: "readonly" },
	entryName: { type: "readonly" },
	organization: { type: "readonly" },
	entryPosition: { type: "readonly" },
	relationshipName: { type: "readonly" },
	koudenAmount: { type: "readonly" },
	offeringTotal: { type: "readonly" },
	totalAmount: { type: "readonly" },
	returnItems: { type: "readonly" },
	returnItemsCost: { type: "readonly" },
	profitLoss: { type: "readonly" },
	shippingInfo: { type: "readonly" },
	returnRecordCreated: { type: "readonly" },
	returnRecordUpdated: { type: "readonly" },
	actions: { type: "readonly" },
};
