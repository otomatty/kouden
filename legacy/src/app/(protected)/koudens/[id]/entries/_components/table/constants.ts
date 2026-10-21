import type { EditableColumnConfig } from "@/types/data-table/table";
import type { Relationship } from "@/types/relationships";

export const attendanceTypeMap = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "欠席",
} as const;

// カスタムソート用の優先順位マップ
export const attendanceTypePriority = {
	FUNERAL: 3,
	CONDOLENCE_VISIT: 2,
	ABSENT: 1,
} as const;

// 返礼状況の優先順位（ソート用）
export const returnStatusPriority = {
	PENDING: 4,
	PARTIAL_RETURNED: 3,
	COMPLETED: 2,
	NOT_REQUIRED: 1,
} as const;

// お供物有無のマップ
export const offeringMap = {
	true: "あり",
	false: "なし",
} as const;

// お供物の優先順位（ソート用）
export const offeringPriority = {
	true: 2,
	false: 1,
} as const;

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	select: "選択",
	name: "ご芳名",
	organization: "団体名",
	position: "役職",
	createdAt: "登録日時",
	relationshipId: "ご関係",
	amount: "金額",
	postalCode: "郵便番号",
	address: "住所",
	phoneNumber: "電話番号",
	attendanceType: "参列",
	hasOffering: "供物",
	returnStatus: "返礼状況",
	notes: "備考",
	actions: "操作",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "name", label: "ご芳名" },
	{ value: "address", label: "住所" },
	{ value: "organization", label: "団体名" },
	{ value: "position", label: "役職" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "amount_desc", label: "金額が高い順" },
	{ value: "amount_asc", label: "金額が低い順" },
	{ value: "name_asc", label: "名前順" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	position: false,
	phoneNumber: false,
	attendanceType: false,
	createdAt: false,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	organization: false,
	postalCode: false,
	address: false,
	notes: false,
};

// 編集可能なカラムの設定
export const editableColumns: Record<string, EditableColumnConfig> = {
	name: { type: "text" },
	organization: { type: "text" },
	position: { type: "text" },
	amount: { type: "number", format: "currency" },
	postalCode: { type: "postal_code" },
	address: { type: "text" },
	phoneNumber: { type: "text" },
	relationshipId: {
		type: "additional-select",
		options: [], // 動的に設定されるため、空配列をデフォルトとする
		addOptionPlaceholder: "関係性を追加",
	},
	attendanceType: {
		type: "select",
		options: ["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"],
	},
	notes: { type: "text" },
	// 編集不可のカラム
	hasOffering: { type: "readonly" },
	returnStatus: { type: "readonly" },
	select: { type: "readonly" },
	actions: { type: "readonly" },
	createdAt: { type: "readonly" },
};
