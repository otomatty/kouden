import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const account: FAQCategory = {
	category: "アカウント関連",
	items: [
		{
			id: "faq-account-1",
			question: "アカウントの作成は無料ですか？",
			answer: "はい、アカウントの作成は無料です。基本的な機能はすべて無料でご利用いただけます。",
		},
		{
			id: "faq-account-2",
			question: "パスワードを登録する必要はありますか？",
			answer:
				"いいえ、本アプリはパスワードレス方式を採用しており、MagicLinkまたはGoogle認証でログインできます。",
		},
		{
			id: "faq-account-3",
			question: "MagicLinkとはなんですか？",
			answer:
				"MagicLinkは、メールアドレスに送信されるリンクです。パスワードが不要で、リンクをクリックするとログインできます。",
		},
		{
			id: "faq-account-4",
			question: "メールアドレスを変更したいです。",
			answer: "現時点では、メールアドレスの変更はできません。今後のアップデートで対応予定です。",
		},
		{
			id: "faq-account-5",
			question: "アカウントを削除できますか？",
			answer:
				"アカウントを削除するためには、「お問い合わせ」から運営にアカウントを削除する旨を伝えてください。アカウントを削除するとすべてのデータが失われるため、注意してください。",
		},
		{
			id: "faq-account-6",
			question: "ソーシャルログイン（Google/Facebook）には対応していますか？",
			answer:
				"はい、Google認証でのログインをサポートしています。Facebookログインは現在未対応です。",
		},
		{
			id: "faq-account-7",
			question: "メールアドレスを変更した後、確認メールが届きません",
			answer:
				"迷惑メールフォルダをご確認ください。数分経っても届かない場合はサポートまでご連絡ください。",
		},
		{
			id: "faq-account-8",
			question: "MagicLinkの有効期限は？",
			answer: "MagicLinkは発行後15分間有効です。",
		},
		{
			id: "faq-account-9",
			question: "同じメールアドレスで複数アカウントを作成できますか？",
			answer: "同一メールアドレスでの複数アカウント作成はできません。",
		},
		{
			id: "faq-account-10",
			question: "ログアウト方法を教えてください",
			answer: "画面右上のユーザーメニューから「ログアウト」を選択してください。",
		},
		{
			id: "faq-account-11",
			question: "アカウント情報をダウンロードできますか？",
			answer: "現在はアカウント情報のダウンロード機能は提供していません。",
		},
	],
};
