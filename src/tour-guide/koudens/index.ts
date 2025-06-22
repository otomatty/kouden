import type { Step } from "@/types/tour";

export const koudensTourSteps: Step[] = [
	{
		element: "[data-tour='header']",
		popover: {
			title: "ヘッダー",
			description: "通知やガイド、ユーザーメニューにアクセスできます。",
		},
	},
	{
		element: "[data-tour='guide-menu-button']",
		popover: {
			title: "ガイドメニュー",
			description: "ここをクリックしてガイドメニューを開いてください。",
		},
	},
	{
		element: "[data-tour='guide-menu-button']",
		popover: {
			title: "ガイドメニューの内容",
			description:
				"ここではページごとのツアーやマニュアルにアクセスできます。各ページの操作方法が知りたい場合は「ツアーを開始する」をクリックしてください。",
		},
	},
	{
		element: "[data-tour='hero-announcements']",
		popover: {
			title: "お知らせ",
			description: "最新のお知らせをスライド形式で確認できます。",
		},
	},
	{
		element: "[data-tour='create-kouden-button']",
		popover: {
			title: "香典帳を作成",
			description: "新しい香典帳を作成できます。",
		},
	},
	{
		element: "[data-tour='kouden-list']",
		popover: {
			title: "香典帳一覧",
			description: "作成済みの香典帳が一覧で表示されます。",
		},
	},
	{
		element: "[data-tour='contextual-info-section']",
		popover: {
			title: "おすすめの情報",
			description: "ブログ記事や使い方の説明など状況に応じたおすすめ情報が表示されます。",
		},
	},
	{
		element: "[data-tour='quick-help-area']",
		popover: {
			title: "クイックヘルプ",
			description: "よくある質問やヘルプに素早くアクセスできます。",
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
];
