import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Share2, FileText } from "lucide-react";
import Link from "next/link";
import { listDonations } from "@/app/_actions/funeral/donations/listDonations";
import { listCases } from "@/app/_actions/funeral/cases/listCases";

export default async function DonationsPage() {
	// 案件一覧を取得
	const cases = await listCases();

	// 各案件の香典記録を取得
	const casesWithDonations = await Promise.all(
		cases.map(async (funeralCase) => {
			const donations = await listDonations(funeralCase.id);
			const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
			return {
				...funeralCase,
				donations,
				totalAmount,
				donationCount: donations.length,
			};
		}),
	);

	return (
		<Container>
			<div className="space-y-6 py-6">
				{/* ヘッダー */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">香典受付記録</h1>
						<p className="text-muted-foreground">葬儀案件ごとの香典受付状況を管理します</p>
					</div>
					<Button asChild>
						<Link href="/funeral-management/donations/create">
							<Plus className="h-4 w-4 mr-2" />
							新規記録
						</Link>
					</Button>
				</div>

				{/* 統計カード */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">総受付件数</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{casesWithDonations.reduce((sum, c) => sum + c.donationCount, 0)}件
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">総受付金額</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								¥{casesWithDonations.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">アクティブ案件</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{casesWithDonations.filter((c) => c.status !== "完了").length}件
							</div>
						</CardContent>
					</Card>
				</div>

				{/* 案件別香典記録一覧 */}
				<div className="space-y-4">
					{casesWithDonations.map((funeralCase) => (
						<Card key={funeralCase.id}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="flex items-center gap-2">
											{funeralCase.deceased_name}様の葬儀
											<Badge
												variant={
													funeralCase.status === "完了"
														? "secondary"
														: funeralCase.status === "施行中"
															? "default"
															: "outline"
												}
											>
												{funeralCase.status}
											</Badge>
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											会場: {funeralCase.venue || "未設定"} | 受付件数: {funeralCase.donationCount}
											件 | 合計金額: ¥{funeralCase.totalAmount.toLocaleString()}
										</p>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/donations/case/${funeralCase.id}/share`}>
												<Share2 className="h-4 w-4 mr-1" />
												香典帳共有
											</Link>
										</Button>
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/donations/case/${funeralCase.id}/report`}>
												<FileText className="h-4 w-4 mr-1" />
												レポート
											</Link>
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{funeralCase.donations.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>寄付者名</TableHead>
												<TableHead>金額</TableHead>
												<TableHead>受付日時</TableHead>
												<TableHead>操作</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{funeralCase.donations.slice(0, 5).map((donation) => (
												<TableRow key={donation.id}>
													<TableCell className="font-medium">
														{donation.donor_name || "匿名"}
													</TableCell>
													<TableCell>¥{donation.amount.toLocaleString()}</TableCell>
													<TableCell>
														{donation.received_at
															? new Date(donation.received_at).toLocaleDateString("ja-JP")
															: "未設定"}
													</TableCell>
													<TableCell>
														<div className="flex gap-1">
															<Button variant="ghost" size="sm" asChild>
																<Link href={`/funeral-management/donations/${donation.id}`}>
																	<Eye className="h-4 w-4" />
																</Link>
															</Button>
															<Button variant="ghost" size="sm" asChild>
																<Link href={`/funeral-management/donations/${donation.id}/edit`}>
																	<Edit className="h-4 w-4" />
																</Link>
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<p>まだ香典の記録がありません</p>
										<Button variant="outline" className="mt-2" asChild>
											<Link href={`/funeral-management/donations/create?caseId=${funeralCase.id}`}>
												<Plus className="h-4 w-4 mr-2" />
												最初の記録を追加
											</Link>
										</Button>
									</div>
								)}
								{funeralCase.donations.length > 5 && (
									<div className="mt-4 text-center">
										<Button variant="outline" asChild>
											<Link href={`/funeral-management/donations/case/${funeralCase.id}`}>
												すべて表示 ({funeralCase.donations.length}件)
											</Link>
										</Button>
									</div>
								)}
								{funeralCase.donations.length > 0 && (
									<div className="mt-4 flex justify-center gap-2">
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/donations/case/${funeralCase.id}`}>
												<Eye className="h-4 w-4 mr-1" />
												香典帳詳細
											</Link>
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>

				{casesWithDonations.length === 0 && (
					<Card>
						<CardContent className="text-center py-12">
							<p className="text-muted-foreground mb-4">まだ葬儀案件がありません</p>
							<Button asChild>
								<Link href="/funeral-management/cases/create">葬儀案件を作成</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</Container>
	);
}
