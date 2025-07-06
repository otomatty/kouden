import type { Metadata } from "next";
import { HelpPageClient } from "./_components/help-page-client";

export const metadata: Metadata = {
	title: "ヘルプ・サポート | 香典帳アプリ",
	description:
		"香典帳アプリの使い方やよくある質問、トラブルシューティングなど、お困りの際のサポート情報をご覧いただけます。",
	keywords: ["ヘルプ", "サポート", "使い方", "FAQ", "マニュアル", "香典帳"],
	openGraph: {
		title: "ヘルプ・サポート | 香典帳アプリ",
		description:
			"香典帳アプリの使い方やよくある質問、トラブルシューティングなど、お困りの際のサポート情報をご覧いただけます。",
		type: "website",
	},
};

/**
 * ヘルプページ
 * マニュアルやブログ記事を統合した総合的なヘルプページ
 */
export default function HelpPage() {
	return <HelpPageClient />;
}
