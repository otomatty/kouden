import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const gifts: FAQCategory = {
	category: "返礼品管理",
	items: [
		{
			id: "faq-thanks-1",
			question: "お礼状のテンプレートは編集できますか？",
			answer:
				"はい、テンプレートの文面は自由にカスタマイズできます。定型文から選択することも可能です。",
		},
		{
			id: "faq-thanks-2",
			question: "宛名印刷の用紙サイズは選べますか？",
			answer: "はい、一般的な封筒サイズに対応しています。カスタムサイズの設定も可能です。",
		},
		{
			id: "faq-gifts-3",
			question: "返礼品の自動提案の基準は？",
			answer: "金額と地域の相場を元にAIが最適な返礼品を提案します。",
		},
		{
			id: "faq-gifts-4",
			question: "返礼品の価格帯を設定できますか？",
			answer: "マイページの返礼品設定から価格帯を自由に設定できます。",
		},
		{
			id: "faq-gifts-5",
			question: "AIによる返礼品提案は利用できますか？",
			answer: "プレミアムプラン限定でAI提案機能をご利用いただけます。",
		},
		{
			id: "faq-gifts-6",
			question: "返礼品リストをカスタマイズできますか？",
			answer: "マイページで項目の追加・編集が可能です。",
		},
		{
			id: "faq-gifts-7",
			question: "返礼品の発送状況は確認できますか？",
			answer: "『発送履歴』タブから確認できます。",
		},
		{
			id: "faq-gifts-8",
			question: "返礼品の在庫管理機能はありますか？",
			answer: "はい、返礼品ごとに在庫数を設定できます。",
		},
		{
			id: "faq-gifts-9",
			question: "カスタム返礼品を追加できますか？",
			answer: "カスタム返礼品を登録して、デフォルトリストに追加できます。",
		},
		{
			id: "faq-gifts-10",
			question: "発送先リストをCSVでダウンロードできますか？",
			answer: "はい、CSV形式で一括ダウンロードが可能です。",
		},
	],
};
