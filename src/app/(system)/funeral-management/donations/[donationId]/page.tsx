import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDonation } from "@/app/_actions/funeral/donations/getDonation";
import { getCase } from "@/app/_actions/funeral/cases/getCase";
import { DeleteDonationButton } from "../_components/delete-donation-button";
import { Label } from "@/components/ui/label";

interface DonationDetailPageProps {
	params: Promise<{
		donationId: string;
	}>;
}

export default async function DonationDetailPage({ params }: DonationDetailPageProps) {
	try {
		const { donationId } = await params;
		const donation = await getDonation(donationId);

		if (!donation) {
			notFound();
		}

		// 関連する案件情報を取得
		const funeralCase = await getCase(donation.case_id);

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
								<h1 className="text-3xl font-bold">香典記録詳細</h1>
								<p className="text-muted-foreground">香典受付記録の詳細情報</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" asChild>
								<Link href={`/funeral-management/donations/${donation.id}/edit`}>
									<Edit className="h-4 w-4 mr-2" />
									編集
								</Link>
							</Button>
							<DeleteDonationButton donationId={donation.id} />
						</div>
					</div>

					{/* 詳細情報 */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* 香典情報 */}
						<Card>
							<CardHeader>
								<CardTitle>香典情報</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="text-sm font-medium text-muted-foreground">寄付者名</Label>
									<p className="text-lg font-medium">{donation.donor_name || "匿名"}</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">金額</Label>
									<p className="text-2xl font-bold text-green-600">
										¥{donation.amount.toLocaleString()}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">受付日時</Label>
									<p className="text-lg">
										{donation.received_at
											? new Date(donation.received_at).toLocaleString("ja-JP")
											: "未設定"}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">記録作成日時</Label>
									<p className="text-sm text-muted-foreground">
										{new Date(donation.created_at).toLocaleString("ja-JP")}
									</p>
								</div>
							</CardContent>
						</Card>

						{/* 関連案件情報 */}
						{funeralCase && (
							<Card>
								<CardHeader>
									<CardTitle>関連案件</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">故人名</Label>
										<p className="text-lg font-medium">{funeralCase.deceased_name}様</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">会場</Label>
										<p className="text-lg">{funeralCase.venue || "未設定"}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">ステータス</Label>
										<div className="mt-1">
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
										</div>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											開始予定日時
										</Label>
										<p className="text-lg">
											{funeralCase.start_datetime
												? new Date(funeralCase.start_datetime).toLocaleString("ja-JP")
												: "未設定"}
										</p>
									</div>
									<div className="pt-2">
										<Button variant="outline" size="sm" asChild>
											<Link href={`/funeral-management/cases/${funeralCase.id}`}>
												案件詳細を見る
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{/* 操作履歴（将来の拡張用） */}
					<Card>
						<CardHeader>
							<CardTitle>操作履歴</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between items-center text-sm">
									<span>記録作成</span>
									<span className="text-muted-foreground">
										{new Date(donation.created_at).toLocaleString("ja-JP")}
									</span>
								</div>
								{/* 将来的に更新履歴なども表示可能 */}
							</div>
						</CardContent>
					</Card>
				</div>
			</Container>
		);
	} catch (error) {
		console.error("Error loading donation:", error);
		notFound();
	}
}
