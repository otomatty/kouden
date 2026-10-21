import type { QuickHelpItem } from "@/types/help";

/**
 * カテゴリ定義の単一ソース。
 * UI表示用の `categoryOptions` と API応答用の `categories` の両方の元になる。
 */
export interface HelpCategoryDef {
	value: "all" | QuickHelpItem["category"];
	label: string;
	iconName: string;
}

export const HELP_CATEGORIES: readonly HelpCategoryDef[] = [
	{ value: "all", label: "すべて", iconName: "HelpCircle" },
	{ value: "basic", label: "基本操作", iconName: "BookOpen" },
	{ value: "advanced", label: "応用機能", iconName: "Settings" },
	{ value: "troubleshooting", label: "トラブル", iconName: "HelpCircle" },
];
