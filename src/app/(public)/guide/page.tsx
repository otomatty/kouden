import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { PageHero } from "../_components/page-hero";
import { FAQSection } from "../_components/faq-section";
import { BasicUsageSection } from "./_components/basic-usage-section";
import { FeaturesSection } from "./_components/features-section";
import { CTASection } from "../_components/cta-section";

export const metadata: Metadata = {
	title: "使い方ガイド | 香典帳",
	description: "香典帳アプリの使い方を詳しく解説します。初めての方でも安心してご利用いただけます。",
};

const guideFaqs = [
	{
		id: "guide-1",
		question: "家族と情報を共有できますか？",
		answer:
			"はい、可能です。家族や親族をメンバーとして招待することで、同じ香典帳の情報を共有できます。",
	},
	{
		id: "guide-2",
		question: "パスワードを忘れた場合、どうすればいいですか？",
		answer: "ログイン画面の「パスワードをお忘れですか？」リンクからパスワードを再設定できます。",
	},
	{
		id: "guide-3",
		question: "アカウントを削除できますか？",
		answer:
			"はい、設定画面のアカウント設定から削除できます。削除すると全データが失われるのでご注意ください。",
	},
	{
		id: "guide-4",
		question: "データをCSVでエクスポートできますか？",
		answer: "はい、設定画面のエクスポート機能からCSV形式でデータをダウンロードできます。",
	},
	{
		id: "guide-5",
		question: "返礼品の候補をカスタマイズできますか？",
		answer: "設定画面の「ギフト設定」から好みの返礼品を選択し、カスタマイズ可能です。",
	},
	{
		id: "guide-6",
		question: "通知設定を変更できますか？",
		answer: "プロフィール設定の通知セクションからリマインダーのオン/オフを切り替えられます。",
	},
];

export default function GuidePage() {
	return (
		<>
			<PageHero
				title="香典帳の使い方ガイド"
				subtitle="初めての方でも安心してご利用いただけるよう、詳しく解説します"
				cta={{
					label: "今すぐ始める",
					href: "/auth/login",
					icon: ChevronRight,
				}}
				className="bg-background"
			/>

			{/* 基本的な使い方セクション */}
			<BasicUsageSection />

			{/* 詳細な機能説明セクション */}
			<FeaturesSection />

			{/* よくある質問セクション */}
			<FAQSection faqs={guideFaqs} />

			{/* サポート情報セクション */}
			<CTASection />
		</>
	);
}
