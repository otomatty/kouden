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
import { ArrowLeft, Share2, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listDonations } from "@/app/_actions/funeral/donations/listDonations";
import { getCase } from "@/app/_actions/funeral/cases/getCase";

interface CaseDonationsPageProps {
	params: Promise<{
		caseId: string;
	}>;
}

export default async function CaseDonationsPage({ params }: CaseDonationsPageProps) {
	try {
		const { caseId } = await params;
		const [funeralCase, donations] = await Promise.all([getCase(caseId), listDonations(caseId)]);

		if (!funeralCase) {
			notFound();
		}

		const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
		const averageAmount = donations.length > 0 ? totalAmount / donations.length : 0;

		// 金額別の統計
		const amountRanges = {
			"〜5,000円": donations.filter((d) => d.amount <= 5000).length,
			"5,001円〜10,000円": donations.filter((d) => d.amount > 5000 && d.amount <= 10000).length,
			"10,001円〜20,000円": donations.filter((d) => d.amount > 10000 && d.amount <= 20000).length,
			"20,001円〜": donations.filter((d) => d.amount > 20000).length,
		};

		return (
			<Container>
				<div className="space-y-6 py-6">
					{/* ヘッダー */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="sm" asChild>
								<Link href="/funeral-management/donations">
									<ArrowLeft className="h-4 w-4 mr-2" />
									戻る
								</Link>
							</Button>
							<div>
								<h1 className="text-3xl font-bold">{funeralCase.deceased_name}様の香典帳</h1>
								<p className="text-muted-foreground">
									{funeralCase.venue && `会場: ${funeralCase.venue} | `}
									{funeralCase.start_datetime &&
										`日時: ${new Date(funeralCase.start_datetime).toLocaleString("ja-JP")}`}
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" asChild>
								<Link href={`/funeral-management/donations/create?caseId=${caseId}`}>
									<Plus className="h-4 w-4 mr-2" />
									記録追加
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href={`/funeral-management/donations/case/${caseId}/share`}>
									<Share2 className="h-4 w-4 mr-2" />
									遺族に共有
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href={`/funeral-management/donations/case/${caseId}/report`}>
									<FileText className="h-4 w-4 mr-2" />
									レポート
								</Link>
							</Button>
						</div>
					</div>

					{/* 統計カード */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">総受付件数</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{donations.length}件</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">総受付金額</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									¥{totalAmount.toLocaleString()}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">平均金額</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									¥{Math.round(averageAmount).toLocaleString()}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">ステータス</CardTitle>
							</CardHeader>
							<CardContent>
								<Badge
									variant={
										funeralCase.status === "完了"
											? "secondary"
											: funeralCase.status === "施行中"
												? "default"
												: "outline"
									}
								>
									{funeralCase.status || "未設定"}
								</Badge>
							</CardContent>
						</Card>
					</div>

					{/* 金額別統計 */}
					<Card>
						<CardHeader>
							<CardTitle>金額別統計</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{Object.entries(amountRanges).map(([range, count]) => (
									<div key={range} className="text-center">
										<p className="text-sm text-muted-foreground">{range}</p>
										<p className="text-xl font-bold">{count}件</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* 香典記録一覧 */}
					<Card>
						<CardHeader>
							<CardTitle>香典記録一覧</CardTitle>
						</CardHeader>
						<CardContent>
							{donations.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>寄付者名</TableHead>
											<TableHead>金額</TableHead>
											<TableHead>受付日時</TableHead>
											<TableHead>記録日時</TableHead>
											<TableHead>操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{donations
											.sort((a, b) => {
												// 受付日時でソート（新しい順）
												if (a.received_at && b.received_at) {
													return (
														new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
													);
												}
												// 作成日時でソート（新しい順）
												return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
											})
											.map((donation) => (
												<TableRow key={donation.id}>
													<TableCell className="font-medium">
														{donation.donor_name || "匿名"}
													</TableCell>
													<TableCell className="font-bold text-green-600">
														¥{donation.amount.toLocaleString()}
													</TableCell>
													<TableCell>
														{donation.received_at
															? new Date(donation.received_at).toLocaleDateString("ja-JP")
															: "未設定"}
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{new Date(donation.created_at).toLocaleDateString("ja-JP")}
													</TableCell>
													<TableCell>
														<div className="flex gap-1">
															<Button variant="ghost" size="sm" asChild>
																<Link href={`/funeral-management/donations/${donation.id}`}>
																	詳細
																</Link>
															</Button>
															<Button variant="ghost" size="sm" asChild>
																<Link href={`/funeral-management/donations/${donation.id}/edit`}>
																	編集
																</Link>
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-12 text-muted-foreground">
									<p className="mb-4">まだ香典の記録がありません</p>
									<Button asChild>
										<Link href={`/funeral-management/donations/create?caseId=${caseId}`}>
											<Plus className="h-4 w-4 mr-2" />
											最初の記録を追加
										</Link>
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</Container>
		);
	} catch (error) {
		console.error("Error loading case donations:", error);
		notFound();
	}
}
