import type { Step } from "@/types/tour";

export const koudensEntriesTourSteps: Step[] = [
	{
		element: "[data-tour='kouden-detail']",
		popover: {
			title: "香典帳の詳細",
			description:
				"香典帳の名前と説明を確認できます。クリックすると編集することができます(編集権限がある場合)",
		},
	},
	{
		element: "[data-tour='export-dropdown']",
		popover: {
			title: "ダウンロード",
			description: "ここをクリックすると、Excel／PDF 形式で香典帳データをダウンロードできます。",
		},
	},
	{
		element: "[data-tour='share-button']",
		popover: {
			title: "共有",
			description: "ここをクリックすると、メンバーとの共有設定画面に移動できます。",
		},
	},
	{
		element: "[data-tour='more-actions-button']",
		popover: {
			title: "その他の操作",
			description: "このメニュー内では、香典帳の重複チェック、複製、削除などの追加操作が行えます。",
		},
	},
	{
		element: "[data-tour='navigation-tabs']",
		popover: {
			title: "機能タブ",
			description: "香典記録、供物、電報、統計、設定の各機能にアクセスできます。",
		},
		media: "desktop",
	},
	{
		element: "[data-tour='bottom-nav-entries']",
		popover: {
			title: "モバイル機能ナビゲーション",
			description: "画面下部のナビゲーションバーから、香典帳の各機能にアクセスできます。",
		},
		media: "mobile",
	},
	{
		element: "[data-tour='data-table-toolbar']",
		popover: {
			title: "検索・フィルター",
			description: "香典記録を検索したり、フィルターで絞り込んだりできます。",
		},
		media: "desktop",
	},
	{
		element: "[data-tour='add-entry-button']",
		popover: {
			title: "新しい記録を追加",
			description: "こちらから新しい香典記録を追加できます。",
		},
	},
	{
		element: "[data-tour='entries-card-list']",
		popover: {
			title: "香典記録一覧（カード表示）",
			description: "カード表示で香典記録を確認できます。",
		},
		media: "mobile",
	},
	{
		element: "[data-tour='entries-table']",
		popover: {
			title: "香典記録一覧",
			description: "登録された香典記録の一覧が表示されます。各行をクリックして編集できます。",
		},
		media: "desktop",
	},
];
