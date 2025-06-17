import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import { CheckCircle, Calendar, Users, Zap, Gift, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { HearingApplicationForm } from "./_components/hearing-application-form";

export const metadata: Metadata = {
	title: "有料プラン無料キャンペーン | 香典帳アプリ公開記念",
	description:
		"香典帳アプリ公開記念！ヒアリングにご協力いただいた方に有料プランを期間限定で無料でご提供いたします。",
};

export default function BasicPlanCampaignPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<Container className="py-12">
				{/* ヒーローセクション */}
				<div className="text-center mb-12">
					<Badge
						variant="secondary"
						className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
					>
						🎉 期間限定キャンペーン
					</Badge>
					<h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						有料プラン
						<br />
						<span className="text-2xl md:text-4xl">期間限定無料</span>
					</h1>
					<p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
						香典帳アプリの公開を記念して、ヒアリングにご協力いただいた皆様に
						<strong className="text-blue-600">有料プランを期間限定で無料</strong>
						でご提供いたします！
					</p>

					{/* キャンペーン期限 */}
					<div className="flex items-center justify-center gap-2 text-red-600 font-medium mb-8">
						<Clock className="h-5 w-5" />
						<span>キャンペーン期限：2025年8月31日まで</span>
					</div>
				</div>

				{/* 有料プランの特典 */}
				<Card className="mb-12 shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl flex items-center justify-center gap-2">
							<Gift className="h-6 w-6 text-blue-600" />
							有料プランで利用できる機能
						</CardTitle>
						<CardDescription>
							ヒアリング参加で、これらの機能が無料でご利用いただけます。
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid md:grid-cols-2 gap-6">
							{[
								{
									icon: CheckCircle,
									title: "永続的な閲覧権限",
									description: "無料プランの2週間制限なしで、いつまでも閲覧可能",
								},
								{
									icon: Users,
									title: "Excel形式での出力",
									description: "PDFだけでなく編集可能なExcelファイルでの出力が可能",
								},
								{
									icon: Zap,
									title: "AI香典登録機能",
									description: "プレミアム以上：AIによる自動香典登録機能（開発中）",
								},
								{
									icon: Calendar,
									title: "Excel一括登録",
									description: "プレミアム以上：Excelで作成した香典記録をアプリに一括登録",
								},
							].map((feature) => (
								<div
									key={feature.title}
									className="flex items-start gap-3 p-4 rounded-lg bg-blue-50"
								>
									<feature.icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
									<div>
										<h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
										<p className="text-sm text-gray-600">{feature.description}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* ヒアリング申し込みフォーム */}
				<Card className="max-w-2xl mx-auto shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">ヒアリング申し込み</CardTitle>
						<CardDescription>
							30分程度のオンラインヒアリングで、アプリの使用感や不具合の有無をお聞かせください
						</CardDescription>
					</CardHeader>
					<CardContent>
						<HearingApplicationForm />
					</CardContent>
				</Card>

				{/* 注意事項 */}
				<div className="mt-12 max-w-2xl mx-auto">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">ご注意事項</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm text-gray-600">
							<p>• ヒアリングは1回あたり30分程度のオンライン形式で実施いたします</p>
							<p>• 対応時間：土日のみ 10:00-18:00（平日は対応しておりません）</p>
							<p>
								• 使用ツール：Google Meet、Zoom、Microsoft
								Teamsのいずれか（お客様のご都合に合わせます）
							</p>
							<p>• 有料プランは香典帳作成から2週間以内の期間限定で無料利用できます</p>
							<p>• 無料期間終了後に料金が自動で発生することはありません</p>
							<p>• キャンペーンの内容は予告なく変更される場合があります</p>
						</CardContent>
					</Card>
				</div>

				{/* フッター */}
				<div className="text-center mt-12">
					<Button asChild variant="outline">
						<Link href="/koudens">
							<ArrowRight className="h-4 w-4 mr-2" />
							香典帳アプリに戻る
						</Link>
					</Button>
				</div>
			</Container>
		</div>
	);
}
