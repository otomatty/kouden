import type { ReactNode } from "react";
import { StructuredData } from "@/components/structured-data";

interface HelpLayoutProps {
	children: ReactNode;
}

/**
 * ヘルプページのレイアウト
 * 公開レイアウトを継承し、ヘルプページに特化したレイアウトを提供
 */
export default function HelpLayout({ children }: HelpLayoutProps) {
	// 構造化データ
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		name: "香典帳アプリ ヘルプ・サポート",
		description:
			"香典帳アプリの使い方やよくある質問、トラブルシューティングなど、お困りの際のサポート情報",
		url: "https://kouden-app.com/help",
		publisher: {
			"@type": "Organization",
			name: "香典帳アプリ",
			url: "https://kouden-app.com",
		},
		potentialAction: {
			"@type": "SearchAction",
			target: "https://kouden-app.com/help?q={search_term_string}",
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<>
			<StructuredData type="WebApplication" data={structuredData} />
			{children}
		</>
	);
}
