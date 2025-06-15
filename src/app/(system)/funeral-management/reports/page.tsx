import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	Calendar,
	FileText,
	BarChart,
	PieChart,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
	return (
		<Container className="py-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">レポート・分析</h1>
				<div className="flex gap-2">
					<select className="px-3 py-2 border rounded-md">
						<option value="2024-12">2024年12月</option>
						<option value="2024-11">2024年11月</option>
						<option value="2024-10">2024年10月</option>
					</select>
					<Button variant="outline">
						<FileText className="h-4 w-4 mr-2" />
						PDF出力
					</Button>
				</div>
			</div>

			{/* KPI概要 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">月間売上</p>
								<p className="text-2xl font-bold">¥3,240,000</p>
								<div className="flex items-center gap-1 text-sm">
									<TrendingUp className="h-4 w-4 text-green-500" />
									<span className="text-green-500">+12.5%</span>
								</div>
							</div>
							<DollarSign className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">月間施行件数</p>
								<p className="text-2xl font-bold">28件</p>
								<div className="flex items-center gap-1 text-sm">
									<TrendingUp className="h-4 w-4 text-green-500" />
									<span className="text-green-500">+8.3%</span>
								</div>
							</div>
							<Calendar className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">平均単価</p>
								<p className="text-2xl font-bold">¥115,714</p>
								<div className="flex items-center gap-1 text-sm">
									<TrendingUp className="h-4 w-4 text-green-500" />
									<span className="text-green-500">+3.8%</span>
								</div>
							</div>
							<BarChart className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">新規顧客</p>
								<p className="text-2xl font-bold">8名</p>
								<div className="flex items-center gap-1 text-sm">
									<TrendingDown className="h-4 w-4 text-red-500" />
									<span className="text-red-500">-5.2%</span>
								</div>
							</div>
							<Users className="h-8 w-8 text-purple-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* レポートメニュー */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							月次売上レポート
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							月別売上推移、前年同月比較、売上構成分析
						</p>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>今月売上:</span>
								<span className="font-semibold">¥3,240,000</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>前月比:</span>
								<Badge variant="secondary" className="text-green-600">
									+12.5%
								</Badge>
							</div>
							<div className="flex justify-between text-sm">
								<span>前年同月比:</span>
								<Badge variant="secondary" className="text-green-600">
									+18.3%
								</Badge>
							</div>
						</div>
						<Button asChild className="w-full mt-4">
							<Link href="/funeral-management/reports/monthly">詳細を見る</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5" />
							会場別利用状況
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							会場別の利用回数、稼働率、売上貢献度分析
						</p>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>○○会館:</span>
								<span className="font-semibold">15件 (53%)</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>△△斎場:</span>
								<span className="font-semibold">8件 (29%)</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>□□寺院:</span>
								<span className="font-semibold">5件 (18%)</span>
							</div>
						</div>
						<Button asChild className="w-full mt-4">
							<Link href="/funeral-management/reports/venue-usage">詳細を見る</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="hover:shadow-md transition-shadow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart className="h-5 w-5" />
							KPIダッシュボード
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							主要業績指標の推移、目標達成率、パフォーマンス分析
						</p>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>月間目標達成率:</span>
								<Badge variant="default" className="text-green-600">
									108%
								</Badge>
							</div>
							<div className="flex justify-between text-sm">
								<span>顧客満足度:</span>
								<span className="font-semibold">4.8/5.0</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>リピート率:</span>
								<span className="font-semibold">23%</span>
							</div>
						</div>
						<Button asChild className="w-full mt-4">
							<Link href="/funeral-management/reports/kpi">詳細を見る</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* 最近の傾向 */}
			<Card>
				<CardHeader>
					<CardTitle>最近の傾向・注目ポイント</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="border-l-4 border-green-500 pl-4">
							<h4 className="font-semibold text-green-700">売上好調</h4>
							<p className="text-sm text-muted-foreground">
								12月の売上は目標を8%上回り、特に家族葬プランの需要が増加しています。
							</p>
						</div>
						<div className="border-l-4 border-yellow-500 pl-4">
							<h4 className="font-semibold text-yellow-700">会場稼働率注意</h4>
							<p className="text-sm text-muted-foreground">
								○○会館の稼働率が90%を超えており、予約調整が必要な状況です。
							</p>
						</div>
						<div className="border-l-4 border-blue-500 pl-4">
							<h4 className="font-semibold text-blue-700">新規顧客獲得</h4>
							<p className="text-sm text-muted-foreground">
								オンライン予約システム導入により、新規顧客の問い合わせが15%増加しました。
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</Container>
	);
}
