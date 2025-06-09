import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, Search, Gift, Share2, Calculator, Bell } from "lucide-react";
import Link from "next/link";
import { PageHero } from "../_components/page-hero";
import { FAQSection } from "../_components/faq-section";

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
		<div className="space-y-8 mb-24">
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
			<section className="container mx-auto">
				<SectionTitle
					title="基本的な使い方"
					subtitle="3ステップで簡単に始められます"
					className="mb-12"
				/>
				<div className="grid md:grid-cols-3 gap-8">
					{[
						{
							id: "create-account",
							icon: BookOpen,
							title: "1. アカウントを作成",
							description: "メールアドレスで簡単に登録できます。家族との共有も可能です。",
						},
						{
							id: "record-kouden",
							icon: Search,
							title: "2. 香典を記録",
							description: "シンプルな入力フォームで、必要な情報を素早く記録できます。",
						},
						{
							id: "manage-return",
							icon: Gift,
							title: "3. 返礼品を管理",
							description: "金額に応じた返礼品の提案を受け取り、進捗を管理できます。",
						},
					].map((step) => (
						<div key={step.id} className="p-6 rounded-lg border bg-card">
							<step.icon className="h-12 w-12 text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-2">{step.title}</h3>
							<p className="text-muted-foreground">{step.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* 詳細な機能説明セクション */}
			<section className="container mx-auto">
				<SectionTitle
					title="主要な機能"
					subtitle="香典帳をより便利に使いこなすための機能"
					className="mb-12"
				/>
				<div className="grid md:grid-cols-2 gap-8">
					{[
						{
							id: "search",
							icon: Search,
							title: "スマートな検索機能",
							description:
								"名前や日付、金額など、様々な条件で過去の記録を検索できます。必要な情報にすぐにアクセス可能です。",
						},
						{
							id: "share",
							icon: Share2,
							title: "家族との共有",
							description:
								"家族や親族とデータを共有できます。リアルタイムで情報を更新でき、常に最新の状態を保てます。",
						},
						{
							id: "calculate",
							icon: Calculator,
							title: "返礼品の計算",
							description:
								"香典の金額から適切な返礼品の価格を自動計算。地域ごとの相場も考慮して、最適な返礼品を提案します。",
						},
						{
							id: "reminder",
							icon: Bell,
							title: "リマインダー機能",
							description:
								"返礼品の準備時期や配送予定日をお知らせ。大切なタイミングを逃さず、適切なお返しができます。",
						},
					].map((feature) => (
						<div
							key={feature.id}
							className="p-8 rounded-lg border bg-card hover:bg-accent transition-colors"
						>
							<feature.icon className="h-10 w-10 text-primary mb-4" />
							<h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
							<p className="text-muted-foreground">{feature.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* よくある質問セクション */}
			<FAQSection faqs={guideFaqs} />

			{/* サポート情報セクション */}
			<section className="text-center">
				<SectionTitle
					title="サポート"
					subtitle="ご不明な点がございましたら、お気軽にお問い合わせください"
					className="mb-8"
				/>
				<Button asChild variant="outline">
					<Link href="/contact">
						お問い合わせ
						<ChevronRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</section>
		</div>
	);
}
