import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const records: FAQCategory = {
	category: "記帳・検索",
	items: [
		{
			id: "faq-data-1",
			question: "誤って記録を削除してしまいました",
			answer: "削除された記録は元に戻すことができません。削除する前に必ず確認してください。",
		},
		{
			id: "faq-other-1",
			question: "スマートフォンでも使えますか？",
			answer: "はい、スマートフォンやタブレットなど、様々な端末からご利用いただけます。",
		},
		{
			id: "faq-other-2",
			question: "オフラインでも使用できますか？",
			answer:
				"基本的にはインターネット接続が必要ですが、一部の機能は接続がない状態でも使用できます。",
		},
		{
			id: "faq-records-4",
			question: "記録に写真を添付できますか？",
			answer:
				"はい、記録に写真や領収書を添付できます。詳細画面の「写真を追加」から操作してください。",
		},
		{
			id: "faq-records-5",
			question: "複数の記録を一括削除できますか？",
			answer: "はい、複数選択後に一括削除が可能です。ただし復元はできませんのでご注意ください。",
		},
		{
			id: "faq-records-6",
			question: "CSV形式で記録をエクスポートできますか？",
			answer: "はい、検索結果画面のエクスポートボタンからCSV形式でダウンロードできます。",
		},
		{
			id: "faq-records-7",
			question: "記録の並び替え方法は？",
			answer: "金額や日付など、列ヘッダーをクリックして昇順・降順で並び替えできます。",
		},
		{
			id: "faq-records-8",
			question: "特定の期間の記録をまとめて表示できますか？",
			answer: "検索画面で期間を指定することで、該当する期間の記録に絞り込めます。",
		},
		{
			id: "faq-records-9",
			question: "記録にメモを追加できますか？",
			answer: "はい、記録作成時や編集時にメモ欄へ自由にテキストを入力できます。",
		},
		{
			id: "faq-records-10",
			question: "記録をテンプレート化して使い回せますか？",
			answer: "よく使う設定をテンプレートとして保存し、新規記録に適用できます。",
		},
	],
};
