import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Heart, Calendar, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { listDonations } from "@/app/_actions/funeral/donations/listDonations";
import { getCase } from "@/app/_actions/funeral/cases/getCase";

interface KoudenPageProps {
	params: Promise<{
		caseId: string;
	}>;
}

export default async function KoudenPage({ params }: KoudenPageProps) {
	const { caseId } = await params;
	try {
		const [funeralCase, donations] = await Promise.all([getCase(caseId), listDonations(caseId)]);

		if (!funeralCase) {
			notFound();
		}

		const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
				<Container>
					<div className="space-y-8 py-12">
						{/* ヘッダー */}
						<div className="text-center space-y-4">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
								<Heart className="h-8 w-8 text-purple-600" />
							</div>
							<h1 className="text-4xl font-bold text-gray-900">
								{funeralCase.deceased_name}様の香典帳
							</h1>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								皆様からお寄せいただいた温かいお気持ちとご厚志を心より感謝申し上げます。
							</p>
						</div>

						{/* 葬儀情報 */}
						<Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
							<CardHeader className="text-center pb-4">
								<CardTitle className="text-xl">葬儀情報</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
									<div className="space-y-2">
										<Calendar className="h-8 w-8 text-gray-500 mx-auto" />
										<div>
											<p className="text-sm text-gray-500 font-medium">日時</p>
											<p className="text-lg">
												{funeralCase.start_datetime
													? new Date(funeralCase.start_datetime).toLocaleDateString("ja-JP", {
															year: "numeric",
															month: "long",
															day: "numeric",
															weekday: "long",
														})
													: "日時未設定"}
											</p>
										</div>
									</div>
									<div className="space-y-2">
										<MapPin className="h-8 w-8 text-gray-500 mx-auto" />
										<div>
											<p className="text-sm text-gray-500 font-medium">会場</p>
											<p className="text-lg">{funeralCase.venue || "会場未設定"}</p>
										</div>
									</div>
									<div className="space-y-2">
										<Users className="h-8 w-8 text-gray-500 mx-auto" />
										<div>
											<p className="text-sm text-gray-500 font-medium">受付件数</p>
											<p className="text-lg font-bold text-purple-600">{donations.length}件</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* 統計サマリー */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<Card className="text-center shadow-lg border-0 bg-white/70 backdrop-blur-sm">
								<CardContent className="pt-6">
									<div className="text-3xl font-bold text-purple-600 mb-2">{donations.length}</div>
									<p className="text-gray-600">ご厚志をいただいた皆様</p>
								</CardContent>
							</Card>
							<Card className="text-center shadow-lg border-0 bg-white/70 backdrop-blur-sm">
								<CardContent className="pt-6">
									<div className="text-3xl font-bold text-green-600 mb-2">
										¥{totalAmount.toLocaleString()}
									</div>
									<p className="text-gray-600">お預かりした総額</p>
								</CardContent>
							</Card>
							<Card className="text-center shadow-lg border-0 bg-white/70 backdrop-blur-sm">
								<CardContent className="pt-6">
									<div className="text-3xl font-bold text-blue-600 mb-2">
										{donations.length > 0
											? `¥${Math.round(totalAmount / donations.length).toLocaleString()}`
											: "¥0"}
									</div>
									<p className="text-gray-600">平均金額</p>
								</CardContent>
							</Card>
						</div>

						{/* 香典記録一覧 */}
						<Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="text-center">お香典記録</CardTitle>
								<p className="text-center text-gray-600 text-sm">
									皆様からお寄せいただいたご厚志の記録です
								</p>
							</CardHeader>
							<CardContent>
								{donations.length > 0 ? (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-center">お名前</TableHead>
													<TableHead className="text-center">金額</TableHead>
													<TableHead className="text-center">受付日</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{donations
													.sort((a, b) => {
														// 受付日時でソート（古い順 - 記録順）
														if (a.received_at && b.received_at) {
															return (
																new Date(a.received_at).getTime() -
																new Date(b.received_at).getTime()
															);
														}
														// 作成日時でソート（古い順）
														return (
															new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
														);
													})
													.map((donation) => (
														<TableRow key={donation.id} className="hover:bg-purple-50/50">
															<TableCell className="text-center font-medium">
																{donation.donor_name || "匿名"}
															</TableCell>
															<TableCell className="text-center font-bold text-green-600">
																¥{donation.amount.toLocaleString()}
															</TableCell>
															<TableCell className="text-center text-gray-600">
																{donation.received_at
																	? new Date(donation.received_at).toLocaleDateString("ja-JP")
																	: new Date(donation.created_at).toLocaleDateString("ja-JP")}
															</TableCell>
														</TableRow>
													))}
											</TableBody>
										</Table>
									</div>
								) : (
									<div className="text-center py-12 text-gray-500">
										<Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
										<p>まだ記録がございません</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* 感謝メッセージ */}
						<Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
							<CardContent className="text-center py-8">
								<div className="max-w-2xl mx-auto space-y-4">
									<h3 className="text-xl font-bold text-gray-900">心より感謝申し上げます</h3>
									<p className="text-gray-600 leading-relaxed">
										{funeralCase.deceased_name}様の葬儀に際し、ご多忙の中をご会葬いただき、
										また過分なるご厚志を賜り、誠にありがとうございました。
										皆様からの温かいお気持ちに、心より感謝申し上げます。
									</p>
									<div className="pt-4">
										<Badge variant="outline" className="text-sm px-4 py-2">
											ご遺族一同
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* フッター */}
						<div className="text-center pt-8 pb-4">
							<p className="text-gray-400 text-sm">
								このページは香典帳管理システムにより生成されています
							</p>
						</div>
					</div>
				</Container>
			</div>
		);
	} catch (error) {
		console.error("Error loading kouden page:", error);
		notFound();
	}
}
