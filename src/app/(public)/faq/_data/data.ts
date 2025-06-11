import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const data: FAQCategory = {
	category: "データ管理",
	items: [
		{
			id: "faq-data-2",
			question: "データはバックアップされますか？",
			answer:
				"はい、すべてのデータは自動的にクラウドにバックアップされます。手動でのエクスポートも可能です。",
		},
		{
			id: "faq-data-3",
			question: "複数の香典帳を作成できますか？",
			answer: "はい、アカウントごとに複数の香典帳を作成・管理することができます。",
		},
		{
			id: "faq-data-4",
			question: "CSVエクスポートの方法は？",
			answer: "記録一覧画面のエクスポートボタンからCSV形式でダウンロードできます。",
		},
		{
			id: "faq-data-5",
			question: "Excel形式で出力できますか？",
			answer: "はい、CSVをExcelで開くか、設定からExcel形式でエクスポート可能です。",
		},
		{
			id: "faq-data-6",
			question: "バックアップデータの保持期間は？",
			answer: "自動バックアップデータは90日間保持されます。",
		},
		{
			id: "faq-data-7",
			question: "データをインポートできますか？",
			answer: "CSVファイルをインポートする機能があり、設定画面のインポートから操作できます。",
		},
		{
			id: "faq-data-8",
			question: "データサイズに制限はありますか？",
			answer: "現在のところ実質的な制限はありませんが、100MB以下を推奨しています。",
		},
		{
			id: "faq-data-9",
			question: "クラウド同期が完了しない場合は？",
			answer:
				"インターネット接続を確認し、再同期ボタンを押してください。それでも問題がある場合はサポートまでご連絡ください。",
		},
		{
			id: "faq-data-10",
			question: "データベースをリセットできますか？",
			answer:
				"設定画面のデータリセットで全データを削除できます。実行前に必ずバックアップをお取りください。",
		},
	],
};
