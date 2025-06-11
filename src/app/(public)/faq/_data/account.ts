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
			question: "メールアドレスを変更したい",
			answer:
				"アカウント設定画面から、メールアドレスの変更が可能です。変更後、確認メールが送信されます。",
		},
		{
			id: "faq-account-4",
			question: "アカウントを削除できますか？",
			answer:
				"設定画面からアカウントを削除できます。削除するとすべてのデータが失われるため、注意してください。",
		},
		{
			id: "faq-account-5",
			question: "ソーシャルログイン（Google/Facebook）には対応していますか？",
			answer:
				"はい、Google認証でのログインをサポートしています。Facebookログインは現在未対応です。",
		},
		{
			id: "faq-account-6",
			question: "メールアドレスを変更した後、確認メールが届きません",
			answer:
				"迷惑メールフォルダをご確認ください。数分経っても届かない場合はサポートまでご連絡ください。",
		},
		{
			id: "faq-account-7",
			question: "MagicLinkの有効期限は？",
			answer: "MagicLinkは発行後15分間有効です。",
		},
		{
			id: "faq-account-8",
			question: "同じメールアドレスで複数アカウントを作成できますか？",
			answer: "同一メールアドレスでの複数アカウント作成はできません。",
		},
		{
			id: "faq-account-9",
			question: "ログアウト方法を教えてください",
			answer: "画面右上のユーザーメニューから「ログアウト」を選択してください。",
		},
		{
			id: "faq-account-10",
			question: "アカウント情報をダウンロードできますか？",
			answer: "現在はアカウント情報のダウンロード機能は提供していません。",
		},
	],
};
