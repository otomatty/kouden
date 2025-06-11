import type { FAQItem, FAQCategory } from "../_components/FAQClient";

export const settings: FAQCategory = {
	category: "設定・通知・セキュリティ",
	items: [
		{
			id: "faq-security-1",
			question: "データは安全に保護されていますか？",
			answer: "はい、すべてのデータは暗号化されて保存されます。個人情報は適切に保護されています。",
		},
		{
			id: "faq-settings-2",
			question: "リマインダー通知の設定方法は？",
			answer: "設定画面の通知タブからリマインダーのオン／オフを切り替えられます。",
		},
		{
			id: "faq-settings-3",
			question: "メール通知を有効／無効にするには？",
			answer: "設定画面の通知設定でメール通知を切り替えできます。",
		},
		{
			id: "faq-settings-4",
			question: "多要素認証（MFA）に対応していますか？",
			answer: "現在は未対応ですが、今後のリリースで対応を予定しています。",
		},
		{
			id: "faq-settings-5",
			question: "セッションタイムアウト時間は？",
			answer: "デフォルトは30分です。設定画面で変更できます。",
		},
		{
			id: "faq-settings-6",
			question: "デバイス認証機能はありますか？",
			answer: "現在はブラウザ単位の認証のみ対応しています。",
		},
		{
			id: "faq-settings-7",
			question: "プライバシーポリシーはどこで確認できますか？",
			answer: "フッターの『プライバシー』リンクからご確認ください。",
		},
		{
			id: "faq-settings-8",
			question: "アクセスログを確認できますか？",
			answer: "管理画面のログ管理タブで直近のアクセスログを表示できます。",
		},
		{
			id: "faq-settings-9",
			question: "データ消去リクエストの方法は？",
			answer: "お問い合わせフォームからデータ消去リクエストを送信できます。",
		},
		{
			id: "faq-settings-10",
			question: "SSL/TLSは使用されていますか？",
			answer: "通信はすべてSSL/TLSで暗号化されています。",
		},
	],
};
