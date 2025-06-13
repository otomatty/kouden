import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Eye, Download, Edit } from "lucide-react";
import Link from "next/link";

export default function QuotesPage() {
	return (
		<div className="p-6 space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">見積管理</h1>
				<Button asChild>
					<Link href="/funeral-management/quotes/create">
						<Plus className="h-4 w-4 mr-2" />
						新規見積作成
					</Link>
				</Button>
			</div>

			{/* 統計カード */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">下書き</p>
								<p className="text-2xl font-bold">3件</p>
							</div>
							<FileText className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">提出済み</p>
								<p className="text-2xl font-bold">8件</p>
							</div>
							<FileText className="h-8 w-8 text-blue-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">承認済み</p>
								<p className="text-2xl font-bold">12件</p>
							</div>
							<FileText className="h-8 w-8 text-green-500" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">今月総額</p>
								<p className="text-2xl font-bold">¥2.4M</p>
							</div>
							<FileText className="h-8 w-8 text-orange-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 検索・フィルター */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">検索・フィルター</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex-1">
							<Input placeholder="見積番号・顧客名で検索..." className="w-full" />
						</div>
						<select className="px-3 py-2 border rounded-md">
							<option value="">全ステータス</option>
							<option value="draft">下書き</option>
							<option value="submitted">提出済み</option>
							<option value="approved">承認済み</option>
							<option value="rejected">却下</option>
						</select>
					</div>
				</CardContent>
			</Card>

			{/* 見積一覧 */}
			<Card>
				<CardHeader>
					<CardTitle>見積一覧</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* サンプルデータ */}
						{[
							{
								id: "1",
								quoteNumber: "Q-2024-001",
								customerName: "田中太郎",
								deceasedName: "田中敏雄",
								totalAmount: 800000,
								status: "承認済み",
								createdAt: "2024-12-10",
								validUntil: "2024-12-25",
							},
							{
								id: "2",
								quoteNumber: "Q-2024-002",
								customerName: "山田花子",
								deceasedName: "山田一郎",
								totalAmount: 1200000,
								status: "提出済み",
								createdAt: "2024-12-12",
								validUntil: "2024-12-27",
							},
							{
								id: "3",
								quoteNumber: "Q-2024-003",
								customerName: "佐藤次郎",
								deceasedName: "佐藤みどり",
								totalAmount: 950000,
								status: "下書き",
								createdAt: "2024-12-15",
								validUntil: "2024-12-30",
							},
						].map((quote) => (
							<div
								key={quote.id}
								className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-3 flex-1">
										<div className="flex items-center gap-3">
											<h3 className="font-semibold text-lg">{quote.quoteNumber}</h3>
											<Badge
												variant={
													quote.status === "承認済み"
														? "default"
														: quote.status === "提出済み"
															? "secondary"
															: quote.status === "下書き"
																? "outline"
																: "destructive"
												}
											>
												{quote.status}
											</Badge>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-muted-foreground">顧客名:</span>
												<span className="ml-2 font-medium">{quote.customerName}</span>
											</div>
											<div>
												<span className="text-muted-foreground">故人名:</span>
												<span className="ml-2 font-medium">{quote.deceasedName} 様</span>
											</div>
											<div>
												<span className="text-muted-foreground">金額:</span>
												<span className="ml-2 font-medium text-lg">
													¥{quote.totalAmount.toLocaleString()}
												</span>
											</div>
											<div>
												<span className="text-muted-foreground">有効期限:</span>
												<span className="ml-2 font-medium">{quote.validUntil}</span>
											</div>
										</div>

										<div className="text-sm text-muted-foreground">作成日: {quote.createdAt}</div>
									</div>

									<div className="flex gap-2 ml-4">
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/quotes/${quote.id}`}>
												<Eye className="h-4 w-4" />
											</Link>
										</Button>
										<Button variant="outline" size="sm">
											<Download className="h-4 w-4" />
										</Button>
										{quote.status === "下書き" && (
											<Button variant="outline" size="sm" asChild>
												<Link href={`/funeral-management/quotes/${quote.id}/edit`}>
													<Edit className="h-4 w-4" />
												</Link>
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
