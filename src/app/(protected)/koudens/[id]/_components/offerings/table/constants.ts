import { Flower2, Gift, Package } from "lucide-react";
import type { OfferingType } from "@/types/offerings";
import type { EditableColumnConfig } from "@/types/table";
import type { LucideIcon } from "lucide-react";

export const typeIcons: Record<OfferingType, LucideIcon> = {
	FLOWER: Flower2,
	FOOD: Gift,
	OTHER: Package,
	INCENSE: Package,
	MONEY: Package,
} as const;

export const typeLabels: Record<OfferingType, string> = {
	FLOWER: "供花",
	FOOD: "供物",
	INCENSE: "線香",
	MONEY: "御供物料",
	OTHER: "その他",
} as const;

export const columnLabels: Record<string, string> = {
	select: "選択",
	type: "種類",
	provider_name: "提供者名",
	description: "内容",
	price: "金額",
	quantity: "数量",
	notes: "備考",
	offering_photos: "写真",
	actions: "アクション",
};

export const searchOptions = [
	{ value: "provider_name", label: "提供者名" },
	{ value: "description", label: "内容" },
	{ value: "type", label: "種類" },
];

export const sortOptions = [
	{ value: "created_at_desc", label: "新しい順" },
	{ value: "created_at_asc", label: "古い順" },
	{ value: "price_desc", label: "金額が高い順" },
	{ value: "price_asc", label: "金額が低い順" },
	{ value: "provider_name_asc", label: "提供者名順" },
	{ value: "type_asc", label: "種類順" },
];

export const filterOptions = [
	{ value: "FLOWER", label: "供花" },
	{ value: "FOOD", label: "供物" },
	{ value: "OTHER", label: "その他" },
];

export const defaultColumnVisibility = {
	notes: false,
	offering_photos: false,
} as const;

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
	description: false,
	quantity: false,
} as const;

export const editableColumns: Record<string, EditableColumnConfig> = {
	provider_name: { type: "text" },
	description: { type: "text" },
	price: { type: "number", format: "currency" },
	quantity: { type: "number" },
	notes: { type: "text" },
	type: {
		type: "select",
		options: Object.entries(typeLabels).map(([value, label]) => ({
			value,
			label,
		})),
	},
	has_photos: {
		type: "boolean",
		options: [
			{ value: "true", label: "あり" },
			{ value: "false", label: "なし" },
		],
	},
	entries: {
		type: "searchable-selector",
		selectorConfig: {
			title: "関連する香典情報を選択",
			description: "この供物に関連する香典情報を選択してください",
			searchPlaceholder: "名前や所属で検索",
		},
	},
	// 編集不可のカラム
	select: { type: "readonly" },
	actions: { type: "readonly" },
	offering_photos: { type: "readonly" },
} as const;

export const OFFERING_TYPES = {
	CONDOLENCE_MONEY: "香典",
	SYMPATHY_MONEY: "御見舞",
	INCENSE_MONEY: "玉串料",
	FLOWER_MONEY: "御花料",
	OFFERING_MONEY: "御供物料",
	TELEGRAM: "弔電",
	FLOWER: "生花",
	OFFERING: "供物",
	WREATH: "花輪",
	OTHERS: "その他",
} as const;

export const OFFERING_TYPE_LABELS = {
	[OFFERING_TYPES.CONDOLENCE_MONEY]: "香典",
	[OFFERING_TYPES.SYMPATHY_MONEY]: "御見舞",
	[OFFERING_TYPES.INCENSE_MONEY]: "玉串料",
	[OFFERING_TYPES.FLOWER_MONEY]: "御花料",
	[OFFERING_TYPES.OFFERING_MONEY]: "御供物料",
	[OFFERING_TYPES.TELEGRAM]: "弔電",
	[OFFERING_TYPES.FLOWER]: "生花",
	[OFFERING_TYPES.OFFERING]: "供物",
	[OFFERING_TYPES.WREATH]: "花輪",
	[OFFERING_TYPES.OTHERS]: "その他",
} as const;
