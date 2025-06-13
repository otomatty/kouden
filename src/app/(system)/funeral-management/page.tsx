import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import {
	Users,
	Calendar,
	FileText,
	DollarSign,
	Package,
	CheckSquare,
	TrendingUp,
	AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function FuneralManagementDashboard() {
	return (
		<Container>
			<div className="space-y-6 py-6">
				{/* 統計カード */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">今月の売上</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">¥3,240,000</div>
							<p className="text-xs text-muted-foreground">前月比 +12.5%</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">アクティブ案件</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">12件</div>
							<p className="text-xs text-muted-foreground">準備中: 5件 / 施行中: 7件</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">顧客数</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">156名</div>
							<p className="text-xs text-muted-foreground">新規: 8名</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">未完了タスク</CardTitle>
							<AlertCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">23件</div>
							<p className="text-xs text-muted-foreground">期限切れ: 3件</p>
						</CardContent>
					</Card>
				</div>

				{/* 機能メニュー */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								顧客管理
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								顧客情報の管理、コミュニケーション履歴、属性管理
							</p>
							<Button asChild className="w-full">
								<Link href="/funeral-management/customers">顧客一覧</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								葬儀案件
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								案件の管理、スケジュール、ステータス遷移
							</p>
							<Button asChild className="w-full">
								<Link href="/funeral-management/cases">案件一覧</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								見積・請求
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								見積書・請求書の作成、PDF生成、支払管理
							</p>
							<div className="space-y-2">
								<Button asChild variant="outline" className="w-full">
									<Link href="/funeral-management/quotes">見積管理</Link>
								</Button>
								<Button asChild variant="outline" className="w-full">
									<Link href="/funeral-management/invoices">請求管理</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								資材管理
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								資材の発注、在庫管理、受発注状況トラッキング
							</p>
							<Button asChild className="w-full">
								<Link href="/funeral-management/materials">資材管理</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckSquare className="h-5 w-5" />
								タスク管理
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								業務タスクの管理、スタッフアサイン、スケジュール
							</p>
							<Button asChild className="w-full">
								<Link href="/funeral-management/tasks">タスク一覧</Link>
							</Button>
						</CardContent>
					</Card>

					<Card className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								レポート
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-4">
								売上分析、KPIダッシュボード、業績レポート
							</p>
							<Button asChild className="w-full">
								<Link href="/funeral-management/reports">レポート</Link>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* 最近のアクティビティ */}
				<Card>
					<CardHeader>
						<CardTitle>最近のアクティビティ</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center justify-between border-b pb-2">
								<div>
									<p className="text-sm font-medium">田中太郎様の葬儀案件が完了しました</p>
									<p className="text-xs text-muted-foreground">2時間前</p>
								</div>
								<Badge variant="secondary">完了</Badge>
							</div>
							<div className="flex items-center justify-between border-b pb-2">
								<div>
									<p className="text-sm font-medium">山田花子様から新規お問い合わせ</p>
									<p className="text-xs text-muted-foreground">4時間前</p>
								</div>
								<Badge variant="outline">新規</Badge>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">資材発注（花輪20個）が承認されました</p>
									<p className="text-xs text-muted-foreground">6時間前</p>
								</div>
								<Badge variant="secondary">承認</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</Container>
	);
}
