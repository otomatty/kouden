import type { Metadata } from "next";

import { Header } from "@/app/(public)/_components/header";
import { LoginForm } from "./_components/login-form";
import { Footer } from "@/app/(public)/_components/footer";
import { Section } from "@/components/ui/section";
import { FAQSection } from "@/app/(public)/_components/faq-section";
import type { FAQ } from "@/types/faq";

// Version fetched from environment variable
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export const metadata: Metadata = {
	title: "ログイン | 香典帳",
	description: "香典帳アプリへようこそ",
};

const faqs: FAQ[] = [
	{
		id: "faq-1",
		question: "新規登録をする必要はないのですか？",
		answer:
			"新規登録の手続きは不要です。ワンタイムパスワードとGoogle認証によって自動的に登録されます。初回ログイン時にアカウントが作成されるため、面倒な登録フォームの入力は一切必要ありません。",
	},
	{
		id: "faq-2",
		question: "ワンタイムパスワードとはなんですか？",
		answer:
			"ワンタイムパスワードとは、メールアドレスに送信される一度限り有効なパスワードです。毎回異なるパスワードが生成されるため、セキュリティが非常に高く、パスワードを覚える必要もありません。メールに記載されたリンクをクリックするか、送信されたコードを入力するだけでログインできます。",
	},
	{
		id: "faq-3",
		question: "パスワードは必要ないのでしょうか？",
		answer:
			"固定のパスワードは必要ありません。セキュリティを重視し、毎回新しいワンタイムパスワードまたはGoogle認証を使用することで、パスワードの管理負担を軽減しつつ、高いセキュリティを実現しています。これにより、パスワードを忘れる心配もなく、安全にご利用いただけます。",
	},
	{
		id: "faq-4",
		question: "Googleアカウントを持っていないのですが、利用できますか？",
		answer:
			"はい、利用できます。Googleアカウントをお持ちでない場合は、メールアドレスでのワンタイムパスワード認証をご利用ください。メールアドレスを入力するだけで、そのアドレス宛にログイン用のパスワードが送信されます。",
	},
	{
		id: "faq-5",
		question: "ワンタイムパスワードのメールが届かない場合はどうすればよいですか？",
		answer:
			"メールが届かない場合は、以下をご確認ください。１）迷惑メールフォルダをご確認ください。２）メールアドレスに入力ミスがないかご確認ください。３）しばらく時間をおいてから再度お試しください。それでも解決しない場合は、お問い合わせフォームよりご連絡ください。",
	},
	{
		id: "faq-6",
		question: "香典帳アプリは無料で利用できますか？",
		answer:
			"基本機能は無料でご利用いただけます。香典の記録や管理、基本的な集計機能などは無料プランでお使いいただけます。より高度な機能や大規模な管理が必要な場合は、有料プランもご用意しております。詳しくは料金プランページをご覧ください。",
	},
	{
		id: "faq-7",
		question: "スマートフォンでも利用できますか？",
		answer:
			"はい、スマートフォンやタブレットでもご利用いただけます。レスポンシブデザインにより、どの端末からでも快適に香典帳の管理ができます。アプリのインストールは不要で、ブラウザからそのままアクセスできます。",
	},
];

export default function LoginPage() {
	return (
		<>
			<Header version={version} />
			<main className="min-h-screen pt-16">
				<Section className="py-24">
					<div className="flex flex-col items-center space-y-8 text-center">
						<div className="space-y-2">
							<p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
								香典帳アプリへようこそ
							</p>
							<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
								ログイン
							</h1>
						</div>
						<div className="w-full max-w-sm space-y-4">
							<LoginForm />
							<p className="text-sm text-gray-500 dark:text-gray-400">
								※ ご利用にはメールアドレスまたはGoogleアカウントでのログインが必要です
								<br />
								Googleアカウントをお持ちでない方は
								<a
									href="https://accounts.google.com/signup"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-500 underline"
								>
									こちら
								</a>
								から作成できます
							</p>
						</div>
					</div>
				</Section>
				<FAQSection faqs={faqs} />
			</main>
			<Footer />
		</>
	);
}
