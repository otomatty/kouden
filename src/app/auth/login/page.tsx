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
		question: "香典帳アプリへようこそ",
		answer: "香典帳アプリへようこそ",
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
