import type { Metadata } from "next";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "料金プラン - 香典帳アプリ",
	description:
		"香典帳アプリの料金プラン一覧です。あなたに最適なプランを選んで、香典管理をもっと楽にしましょう。",
};

export default function PricingPage() {
	return (
		<div className="container mx-auto px-4 py-12 md:py-16">
			{/* Hero Section */}
			<section className="text-center mb-12 md:mb-16">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
					最適なプランで、香典管理をもっと楽に
				</h1>
				<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
					大切な記録を確実に守り、面倒な作業から解放されるためのプランをご用意。あなたにぴったりのサポートを選んで、心と時間にゆとりを。
				</p>
			</section>

			{/* Plan Cards */}
			<section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
				{/* Free Plan */}
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">フリープラン</CardTitle>
						<CardDescription className="text-3xl font-bold pt-2">無料</CardDescription>
					</CardHeader>
					<CardContent className="flex-grow">
						<ul className="space-y-2 text-sm">
							<li>✔︎ 端末内保存</li>
							<li>✔︎ 広告表示あり</li>
							<li className="text-muted-foreground">✘ CSV/Excelエクスポート (制限付き)</li>
							<li className="text-muted-foreground">✘ クラウド同期 (制限付き)</li>
						</ul>
						<p className="text-xs text-muted-foreground mt-4">
							まずは基本的な機能をお試しください。
						</p>
					</CardContent>
					<CardFooter>
						<Button type="button" variant="outline" className="w-full">
							今すぐ試す
						</Button>
					</CardFooter>
				</Card>

				{/* Basic Plan */}
				<Card className="flex flex-col border-2 border-primary shadow-lg relative">
					<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
						おすすめ
					</div>
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">ベーシックプラン</CardTitle>
						<CardDescription className="text-3xl font-bold pt-2">
							2,980円 <span className="text-sm font-normal text-muted-foreground">/ 買い切り</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-grow">
						<p className="text-sm text-muted-foreground mb-3">
							大切な記録を安全・確実に管理し、自由に活用したいあなたへ。
						</p>
						<ul className="space-y-2 text-sm">
							<li>✔︎ データの永続化 (クラウド同期)</li>
							<li>✔︎ 広告非表示</li>
							<li>✔︎ CSV/Excelエクスポート機能</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button type="button" className="w-full">
							購入する
						</Button>
					</CardFooter>
				</Card>

				{/* Premium Plan (Recommended) */}
				<Card className="flex flex-col">
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">プレミアムプラン</CardTitle>
						<CardDescription className="text-3xl font-bold pt-2">
							7,980円 <span className="text-sm font-normal text-muted-foreground">/ 買い切り</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-grow">
						<p className="text-sm text-muted-foreground mb-3">
							AIで入力作業を劇的に効率化。心と時間にゆとりを。
						</p>
						<ul className="space-y-2 text-sm">
							<li>✔︎ ベーシックプランの全機能</li>
							<li>✔︎ AI入力支援 (入力時間90%削減)</li>
							<li>✔︎ 優先サポート</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button type="button" className="w-full">
							購入する
						</Button>
					</CardFooter>
				</Card>
			</section>

			{/* Full Support Plan */}
			<section className="bg-muted rounded-lg">
				<Card className="bg-background shadow-none border-none">
					<div className="grid md:grid-cols-2 gap-6 items-center">
						<div>
							<CardHeader className="px-0 md:px-6">
								<CardTitle className="text-2xl md:text-3xl font-bold">フルサポートプラン</CardTitle>
							</CardHeader>
							<CardContent className="px-0 md:px-6">
								<p className="mb-4 text-muted-foreground">
									プレミアムプランの全機能に加え、オンラインビデオ通話でのマンツーマンサポートを提供。ITは分かるけど今は誰かに頼りたい、そんなあなたを専門家が最後まで伴走します。
								</p>
								<ul className="mb-6 space-y-2 text-sm">
									<li>✔︎ プレミアムプランの全機能</li>
									<li>✔︎ オンラインマンツーマンサポート</li>
									<li>✔︎ 100件までの入力サポート込み</li>
									<li>✔︎ 追加サポート (101件目以降50件ごと目安)</li>
									<li>✔︎ CSVエクスポート後の活用アドバイス</li>
								</ul>
							</CardContent>
						</div>
						<div className="px-0 md:px-6 flex items-center justify-center md:justify-end">
							<CardFooter className="p-0 md:p-6 w-full md:w-auto">
								<Button type="button" size="lg" asChild className="w-full md:w-auto">
									<Link href="/plans/full-support">詳細・お申し込み</Link>
								</Button>
							</CardFooter>
						</div>
					</div>
				</Card>
			</section>
		</div>
	);
}
