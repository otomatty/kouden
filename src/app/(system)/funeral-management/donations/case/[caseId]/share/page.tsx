import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Container from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Share2, Mail, Copy, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/app/_actions/funeral/cases/getCase";
import { ShareForm } from "../_components/share-form";

interface ShareDonationPageProps {
	params: Promise<{
		caseId: string;
	}>;
}

export default async function ShareDonationPage({ params }: ShareDonationPageProps) {
	try {
		const { caseId } = await params;
		const funeralCase = await getCase(caseId);

		if (!funeralCase) {
			notFound();
		}

		// 共有用のURLを生成（実際の実装では適切なドメインとトークンを使用）
		const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/kouden/${caseId}`;

		return (
			<Container>
				<div className="space-y-6 py-6">
					{/* ヘッダー */}
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/funeral-management/donations/case/${caseId}`}>
								<ArrowLeft className="h-4 w-4 mr-2" />
								戻る
							</Link>
						</Button>
						<div>
							<h1 className="text-3xl font-bold">香典帳の共有</h1>
							<p className="text-muted-foreground">
								{funeralCase.deceased_name}様の香典帳を遺族に共有します
							</p>
						</div>
					</div>

					{/* 案件情報 */}
					<Card>
						<CardHeader>
							<CardTitle>案件情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
						</CardContent>
					</Card>

					{/* 共有URL */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Share2 className="h-5 w-5" />
								共有URL
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="shareUrl">香典帳の閲覧URL</Label>
								<div className="flex gap-2 mt-2">
									<Input id="shareUrl" value={shareUrl} readOnly className="font-mono text-sm" />
									<Button variant="outline" size="sm">
										<Copy className="h-4 w-4 mr-2" />
										コピー
									</Button>
									<Button variant="outline" size="sm" asChild>
										<Link href={shareUrl} target="_blank">
											<ExternalLink className="h-4 w-4 mr-2" />
											プレビュー
										</Link>
									</Button>
								</div>
								<p className="text-sm text-muted-foreground mt-2">
									このURLを遺族に共有することで、香典帳を閲覧できるようになります。
								</p>
							</div>
						</CardContent>
					</Card>

					{/* メール送信フォーム */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								メールで共有
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ShareForm caseId={caseId} shareUrl={shareUrl} funeralCase={funeralCase} />
						</CardContent>
					</Card>

					{/* 共有設定 */}
					<Card>
						<CardHeader>
							<CardTitle>共有設定</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<Label className="text-sm font-medium">アクセス権限</Label>
									<div className="mt-2 space-y-2">
										<div className="flex items-center gap-2">
											<Eye className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">閲覧のみ（推奨）</span>
										</div>
										<p className="text-xs text-muted-foreground ml-6">
											遺族は香典記録を閲覧することができますが、編集はできません。
										</p>
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium">有効期限</Label>
									<div className="mt-2">
										<Badge variant="outline">無期限</Badge>
										<p className="text-xs text-muted-foreground mt-1">
											URLは無期限で有効です。必要に応じて無効化できます。
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* 注意事項 */}
					<Card>
						<CardHeader>
							<CardTitle>共有時の注意事項</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 text-sm">
								<div className="flex items-start gap-2">
									<span className="text-muted-foreground">•</span>
									<p>共有URLを知っている人は誰でも香典帳を閲覧できます。</p>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-muted-foreground">•</span>
									<p>遺族のプライバシーを保護するため、URLの取り扱いには十分注意してください。</p>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-muted-foreground">•</span>
									<p>共有された香典帳は読み取り専用で、遺族による編集はできません。</p>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-muted-foreground">•</span>
									<p>必要に応じて、管理画面からアクセス権限を無効化できます。</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</Container>
		);
	} catch (error) {
		console.error("Error loading case for sharing:", error);
		notFound();
	}
}
