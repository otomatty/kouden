import type { Step } from "@/types/tour";

export const koudensEntriesTourSteps: Step[] = [
	{
		element: "[data-tour='kouden-detail']",
		popover: {
			title: "香典帳の詳細",
			description: "香典帳の基本情報を確認・編集できます。",
		},
	},
	{
		element: "[data-tour='navigation-tabs']",
		popover: {
			title: "機能タブ",
			description: "香典記録、供物、電報、統計、設定の各機能にアクセスできます。",
		},
	},
	{
		element: "[data-tour='data-table-toolbar']",
		popover: {
			title: "検索・フィルター",
			description: "香典記録を検索したり、フィルターで絞り込んだりできます。",
		},
	},
	{
		element: "[data-tour='add-entry-button']",
		popover: {
			title: "新しい記録を追加",
			description: "こちらから新しい香典記録を追加できます。",
		},
	},
	{
		element: "[data-tour='entries-table']",
		popover: {
			title: "香典記録一覧",
			description: "登録された香典記録の一覧が表示されます。各行をクリックして編集できます。",
		},
	},
];
