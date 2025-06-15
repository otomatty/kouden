import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, User, Phone, Mail } from "lucide-react";
import { getCase } from "@/app/_actions/funeral/cases/getCase";
import { getKoudenForCase } from "@/app/_actions/funeral/kouden/create";
import { CreateKoudenButton } from "./_components/create-kouden-button";
import { KoudenManagementCard } from "./_components/kouden-management-card";

interface CaseDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
	const { id } = await params;

	try {
		const [funeralCase, koudenCase] = await Promise.all([getCase(id), getKoudenForCase(id)]);

		if (!funeralCase) {
			notFound();
		}

		return (
			<div className="container mx-auto p-6 space-y-6">
				{/* ヘッダー */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Link href="/funeral-management/cases">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								案件一覧に戻る
							</Button>
						</Link>
						<div>
							<h1 className="text-2xl font-bold">{funeralCase.deceased_name}様の葬儀案件</h1>
							<p className="text-muted-foreground">案件ID: {funeralCase.id}</p>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Badge variant={funeralCase.status === "進行中" ? "default" : "secondary"}>
							{funeralCase.status || "未設定"}
						</Badge>
						<Link href={`/funeral-management/cases/${id}/edit`}>
							<Button variant="outline">編集</Button>
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* 左側: 案件詳細 */}
					<div className="lg:col-span-2 space-y-6">
						{/* 基本情報 */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<User className="h-5 w-5 mr-2" />
									基本情報
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">故人名</Label>
										<p className="text-lg font-semibold">{funeralCase.deceased_name}様</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">ステータス</Label>
										<p>
											<Badge variant={funeralCase.status === "進行中" ? "default" : "secondary"}>
												{funeralCase.status || "未設定"}
											</Badge>
										</p>
									</div>
								</div>

								{funeralCase.venue && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground flex items-center">
											<MapPin className="h-4 w-4 mr-1" />
											会場
										</Label>
										<p>{funeralCase.venue}</p>
									</div>
								)}

								{funeralCase.start_datetime && (
									<div>
										<Label className="text-sm font-medium text-muted-foreground flex items-center">
											<Calendar className="h-4 w-4 mr-1" />
											開始日時
										</Label>
										<p>
											{new Date(funeralCase.start_datetime).toLocaleString("ja-JP", {
												year: "numeric",
												month: "long",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								)}

								<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
									<div>
										<Label>作成日時</Label>
										<p>
											{new Date(funeralCase.created_at).toLocaleString("ja-JP", {
												year: "numeric",
												month: "short",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
									{funeralCase.updated_at && (
										<div>
											<Label>更新日時</Label>
											<p>
												{new Date(funeralCase.updated_at).toLocaleString("ja-JP", {
													year: "numeric",
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* 顧客情報 */}
						{funeralCase.customer && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center">
										<User className="h-5 w-5 mr-2" />
										ご遺族情報
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-sm font-medium text-muted-foreground">お名前</Label>
											<p className="font-semibold">{funeralCase.customer.name}</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground flex items-center">
												<Mail className="h-4 w-4 mr-1" />
												メールアドレス
											</Label>
											<p>{funeralCase.customer.email}</p>
										</div>
									</div>

									{funeralCase.customer.phone && (
										<div>
											<Label className="text-sm font-medium text-muted-foreground flex items-center">
												<Phone className="h-4 w-4 mr-1" />
												電話番号
											</Label>
											<p>{funeralCase.customer.phone}</p>
										</div>
									)}

									{funeralCase.customer.details && (
										<>
											<Separator />
											<div className="space-y-3">
												{funeralCase.customer.details.address && (
													<div>
														<Label className="text-sm font-medium text-muted-foreground">
															住所
														</Label>
														<p>{funeralCase.customer.details.address}</p>
													</div>
												)}

												<div className="grid grid-cols-2 gap-4">
													{funeralCase.customer.details.religion && (
														<div>
															<Label className="text-sm font-medium text-muted-foreground">
																宗派
															</Label>
															<p>{funeralCase.customer.details.religion}</p>
														</div>
													)}
													{funeralCase.customer.details.status && (
														<div>
															<Label className="text-sm font-medium text-muted-foreground">
																ステータス
															</Label>
															<p>
																<Badge variant="outline">
																	{funeralCase.customer.details.status}
																</Badge>
															</p>
														</div>
													)}
												</div>

												{funeralCase.customer.details.allergy && (
													<div>
														<Label className="text-sm font-medium text-muted-foreground">
															アレルギー情報
														</Label>
														<p className="text-red-600">{funeralCase.customer.details.allergy}</p>
													</div>
												)}

												{funeralCase.customer.details.notes && (
													<div>
														<Label className="text-sm font-medium text-muted-foreground">
															備考
														</Label>
														<p className="whitespace-pre-wrap">
															{funeralCase.customer.details.notes}
														</p>
													</div>
												)}
											</div>
										</>
									)}
								</CardContent>
							</Card>
						)}
					</div>

					{/* 右側: 香典帳管理 */}
					<div className="space-y-6">
						{koudenCase ? (
							<KoudenManagementCard koudenCase={koudenCase} />
						) : (
							<Card>
								<CardHeader>
									<CardTitle>香典帳管理</CardTitle>
									<CardDescription>この案件の香典帳を作成・管理できます</CardDescription>
								</CardHeader>
								<CardContent>
									<CreateKoudenButton
										caseId={id}
										defaultTitle={`${funeralCase.deceased_name}様の香典帳`}
									/>
								</CardContent>
							</Card>
						)}

						{/* クイックアクション */}
						<Card>
							<CardHeader>
								<CardTitle>クイックアクション</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Link href={`/funeral-management/cases/${id}/attendees`}>
									<Button variant="outline" className="w-full justify-start">
										参列者管理
									</Button>
								</Link>
								<Link href={`/funeral-management/cases/${id}/quotes`}>
									<Button variant="outline" className="w-full justify-start">
										見積管理
									</Button>
								</Link>
								<Link href={`/funeral-management/cases/${id}/tasks`}>
									<Button variant="outline" className="w-full justify-start">
										タスク管理
									</Button>
								</Link>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("[ERROR] Error loading case details:", error);
		notFound();
	}
}
