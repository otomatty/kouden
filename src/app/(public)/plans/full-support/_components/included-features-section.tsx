import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, HelpCircle } from "lucide-react";

export default function IncludedFeaturesSection() {
	return (
		<section className="mb-12 md:mb-16">
			<h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">プランに含まれるもの</h2>
			<div className="grid md:grid-cols-2 gap-8 items-start">
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center">
							<CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
							プレミアムプランの全機能
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>ベーシックプランの機能に加え、以下をご利用いただけます。</p>
						<ul className="list-disc list-inside pl-4 text-muted-foreground">
							<li>AI入力支援（入力時間90%削減）</li>
							<li>優先サポート</li>
						</ul>
						<p className="mt-2">
							<Link
								href="/pricing#premium-plan" // プレミアムプランへのアンカーリンク（仮）
								className="text-sm text-primary hover:underline"
							>
								プレミアムプランの詳細はこちら
							</Link>
						</p>
					</CardContent>
				</Card>
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center">
							<HelpCircle className="h-6 w-6 text-blue-500 mr-2" />
							オンラインマンツーマンサポート
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p>オンラインビデオ通話を通じて、専門家が以下のサポートを提供します。</p>
						<ul className="list-disc list-inside pl-4 text-muted-foreground">
							<li>アプリの操作説明</li>
							<li>香典情報の共同入力作業</li>
							<li>入力内容の確認、疑問点の即時解決</li>
							<li>CSVエクスポート後の活用アドバイス</li>
							<li>その他、アプリを最大限に活用するためのコンサルティング</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
