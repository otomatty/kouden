/**
 * ドキュメントの表示順序と設定を管理する
 */

export interface CategoryConfig {
	name: string;
	order: number;
	docs: string[]; // スラッグの順序
}

export interface DocsConfig {
	categories: Record<string, CategoryConfig>;
	defaultOrder: number;
}

/**
 * ドキュメントの表示設定
 * カテゴリとドキュメントの順序を定義
 */
export const docsConfig: DocsConfig = {
	categories: {
		"getting-started": {
			name: "はじめに",
			order: 1,
			docs: [
				"introduction", // 香典帳アプリとは
				"excel-comparison", // Excelとの比較
				"account-setup", // アカウント登録ガイド
				"basic-usage", // 基本的な使い方
				"first-steps-faq", // よくある最初の質問
			],
		},
		"basic-operations": {
			name: "基本操作",
			order: 2,
			docs: [
				"creating-kouden", // 香典帳の作成方法
				"inviting-members", // メンバーの招待と権限管理
				"navigation-guide", // アプリの基本的な操作方法
				"account-settings", // アカウント設定とプロフィール管理
			],
		},
		"kouden-entries": {
			name: "香典記録",
			order: 3,
			docs: [
				"recording-entries", // 香典の記録方法
				"entry-management", // 記録した香典の編集・削除
				"bulk-operations", // 一括操作機能
				"duplicate-detection", // 重複チェック機能
				"search-and-filter", // 検索・絞り込み機能
			],
		},
		offerings: {
			name: "供物管理",
			order: 4,
			docs: [
				"recording-offerings", // 供物の記録方法
				"offering-categories", // 供物の分類と管理
				"photo-management", // 供物写真の管理
				"offering-management", // 供物管理機能（既存）
			],
		},
		"return-management": {
			name: "返礼品管理",
			order: 5,
			docs: [
				"return-items-setup", // 返礼品マスターの設定
				"return-records", // 返礼記録の管理
				"bulk-return-processing", // 一括返礼処理
				"delivery-tracking", // 配送状況の管理
			],
		},
		telegrams: {
			name: "電報管理",
			order: 6,
			docs: [
				"recording-telegrams", // 電報の記録方法
				"telegram-management", // 電報情報の管理
			],
		},
		statistics: {
			name: "統計・レポート",
			order: 7,
			docs: [
				"statistics-overview", // 統計機能の概要
				"generating-reports", // レポート生成機能
				"pdf-export", // PDF出力機能
				"data-analysis", // データ分析の活用方法
			],
		},
		permissions: {
			name: "権限・セキュリティ",
			order: 8,
			docs: [
				"role-management", // 役割と権限の管理
				"member-permissions", // メンバー権限の詳細
				"data-security", // データセキュリティについて
			],
		},
		advanced: {
			name: "高度な機能",
			order: 9,
			docs: [
				"api-integration", // API連携機能
				"automation", // 自動化機能
				"custom-fields", // カスタムフィールドの設定
				"backup-restore", // データのバックアップと復元
			],
		},
		troubleshooting: {
			name: "トラブルシューティング",
			order: 10,
			docs: [
				"common-issues", // よくある問題と解決方法
				"error-messages", // エラーメッセージの対応
				"performance-issues", // パフォーマンス問題の解決
				"data-recovery", // データ復旧について
			],
		},
		faq: {
			name: "よくある質問",
			order: 11,
			docs: [
				"general", // 一般的な質問
			],
		},
	},
	defaultOrder: 999, // 設定されていないカテゴリのデフォルト順序
};

/**
 * カテゴリ名を取得
 */
export function getCategoryName(categorySlug: string): string {
	return docsConfig.categories[categorySlug]?.name || categorySlug;
}

/**
 * カテゴリの表示順序を取得
 */
export function getCategoryOrder(categorySlug: string): number {
	return docsConfig.categories[categorySlug]?.order || docsConfig.defaultOrder;
}

/**
 * ドキュメントの表示順序を取得
 */
export function getDocOrder(categorySlug: string, docSlug: string): number {
	const docs = docsConfig.categories[categorySlug]?.docs || [];
	const index = docs.indexOf(docSlug);
	return index >= 0 ? index : 999; // 設定されていない場合は最後に
}
