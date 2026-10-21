import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, Clock, Users, RefreshCw, Home, Mail } from "lucide-react";

interface InvitationErrorPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function InvitationErrorContent({
	searchParams,
}: { searchParams: { [key: string]: string | string[] | undefined } }) {
	const error =
		typeof searchParams.error === "string" ? searchParams.error : "不明なエラーが発生しました";
	const type = typeof searchParams.type === "string" ? searchParams.type : "unknown";

	// エラータイプに基づいてアイコンと推奨アクションを決定
	const getErrorInfo = () => {
		switch (type) {
			case "invalid":
				return {
					icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
					title: "招待リンクが無効です",
					description: "この招待リンクは使用できません。",
					actions: [
						{
							label: "香典帳一覧に戻る",
							href: "/koudens",
							variant: "default" as const,
							icon: <Home className="h-4 w-4" />,
						},
						{
							label: "新しい招待を依頼する",
							href: "/contact",
							variant: "outline" as const,
							icon: <Mail className="h-4 w-4" />,
						},
					],
				};
			case "server":
				return {
					icon: <RefreshCw className="h-12 w-12 text-destructive" />,
					title: "サーバーエラーが発生しました",
					description: "一時的な問題が発生している可能性があります。",
					actions: [
						{
							label: "再試行する",
							href: window.location.href,
							variant: "default" as const,
							icon: <RefreshCw className="h-4 w-4" />,
						},
						{
							label: "香典帳一覧に戻る",
							href: "/koudens",
							variant: "outline" as const,
							icon: <Home className="h-4 w-4" />,
						},
					],
				};
			default:
				return {
					icon: <AlertTriangle className="h-12 w-12 text-destructive" />,
					title: "招待の処理に失敗しました",
					description: "予期せぬエラーが発生しました。",
					actions: [
						{
							label: "香典帳一覧に戻る",
							href: "/koudens",
							variant: "default" as const,
							icon: <Home className="h-4 w-4" />,
						},
					],
				};
		}
	};

	const errorInfo = getErrorInfo();

	// 具体的なエラーメッセージに基づく詳細説明
	const getDetailedDescription = () => {
		switch (error) {
			case "招待が見つかりません":
				return "この招待リンクは存在しないか、削除されている可能性があります。招待者に新しいリンクの作成を依頼してください。";
			case "招待の有効期限が切れています":
				return "この招待リンクの有効期限が切れています。招待者に新しいリンクの作成を依頼してください。";
			case "この招待は既に使用されています":
				return "この招待リンクは既に使用済みです。使用回数制限がある招待の場合、上限に達している可能性があります。";
			case "招待の使用回数が上限に達しました":
				return "この招待リンクの使用回数が上限に達しました。招待者に新しいリンクの作成を依頼してください。";
			case "すでにメンバーとして参加しています":
				return "あなたは既にこの香典帳のメンバーです。香典帳一覧からアクセスできます。";
			default:
				return errorInfo.description;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-8 px-4 sm:px-6 lg:px-8">
			<div className="container max-w-2xl mx-auto">
				<Card className="backdrop-blur-sm bg-card/95 shadow-lg border-muted">
					<CardHeader className="text-center space-y-4">
						<div className="flex justify-center">{errorInfo.icon}</div>
						<CardTitle className="text-2xl sm:text-3xl font-bold text-destructive">
							{errorInfo.title}
						</CardTitle>
						<CardDescription className="text-base">{getDetailedDescription()}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* エラーの詳細情報 */}
						<div className="rounded-lg bg-muted/50 p-4">
							<h3 className="font-semibold text-sm text-muted-foreground mb-2">エラーの詳細</h3>
							<p className="text-sm font-mono bg-background p-2 rounded border">{error}</p>
						</div>

						{/* 推奨アクション */}
						<div className="space-y-3">
							<h3 className="font-semibold text-sm text-muted-foreground">推奨アクション</h3>
							<div className="space-y-2">
								{errorInfo.actions.map((action) => (
									<Button
										key={action.label}
										asChild
										variant={action.variant}
										className="w-full justify-start"
									>
										<Link href={action.href} className="flex items-center gap-2">
											{action.icon}
											{action.label}
										</Link>
									</Button>
								))}
							</div>
						</div>

						{/* 追加のヘルプ情報 */}
						<div className="border-t pt-4">
							<details className="space-y-2">
								<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
									問題が解決しない場合は...
								</summary>
								<div className="text-sm text-muted-foreground space-y-2 pl-4">
									<p>• 招待者に連絡して、新しい招待リンクの作成を依頼してください</p>
									<p>• ブラウザのキャッシュをクリアしてから再試行してください</p>
									<p>• 問題が継続する場合は、サポートにお問い合わせください</p>
								</div>
							</details>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default async function InvitationErrorPage({ searchParams }: InvitationErrorPageProps) {
	const resolvedSearchParams = await searchParams;

	// エラーパラメータが存在しない場合は404
	if (!resolvedSearchParams.error) {
		notFound();
	}

	return (
		<Suspense fallback={<div>読み込み中...</div>}>
			<InvitationErrorContent searchParams={resolvedSearchParams} />
		</Suspense>
	);
}
