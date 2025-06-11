import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const sharing: FAQCategory = {
	category: "共有・コラボレーション",
	items: [
		{
			id: "faq-security-2",
			question: "他の人に共有することはできますか？",
			answer:
				"はい、特定の香典帳を他のユーザーと共有することができます。共有相手ごとに権限を設定できます。",
		},
		{
			id: "faq-sharing-2",
			question: "特定のメンバーだけ編集権限を与えられますか？",
			answer: "はい、メンバーごとに閲覧／編集などの権限を設定できます。",
		},
		{
			id: "faq-sharing-3",
			question: "招待リンクの有効期限はありますか？",
			answer: "招待リンクは発行後24時間有効です。期限切れ後は再発行してください。",
		},
		{
			id: "faq-sharing-4",
			question: "メンバーを削除するには？",
			answer: "共有設定画面から対象メンバーの『削除』ボタンを押すと削除できます。",
		},
		{
			id: "faq-sharing-5",
			question: "招待メールを再送できますか？",
			answer: "共有設定画面のメンバー一覧から再送ボタンで招待メールを再送可能です。",
		},
		{
			id: "faq-sharing-6",
			question: "ロールごとの権限設定はありますか？",
			answer: "はい、管理者／編集者／閲覧者のロールを選択できます。",
		},
		{
			id: "faq-sharing-7",
			question: "共有通知の設定はできますか？",
			answer: "通知設定画面で共有に関する通知をオン／オフできます。",
		},
		{
			id: "faq-sharing-8",
			question: "共有データの変更履歴を確認できますか？",
			answer: "はい、変更履歴タブから確認できます。",
		},
		{
			id: "faq-sharing-9",
			question: "招待管理画面はどこにありますか？",
			answer: "ヘッダーのユーザーメニューから『共有管理』へ遷移します。",
		},
		{
			id: "faq-sharing-10",
			question: "招待したメンバー一覧をCSVでエクスポートできますか？",
			answer: "はい、共有管理画面のエクスポートボタンからCSV形式で出力できます。",
		},
	],
};
