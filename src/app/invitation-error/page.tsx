import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Header } from "@/app/(public)/_components/header";
import Link from "next/link";
import pkg from "../../../package.json";

const version = pkg.version;

interface PageProps {
	params: Promise<Record<string, never>>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InvitationErrorPage({ searchParams }: PageProps) {
	const resolvedParams = await searchParams;
	const errorMessage = resolvedParams.error as string | undefined;

	return (
		<>
			<Header version={version} />
			<main className="min-h-screen pt-16">
				<div className="container max-w-2xl py-8">
					<div className="mb-6">
						<Link href="/">
							<Button variant="ghost" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								トップページに戻る
							</Button>
						</Link>
					</div>
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<CardTitle>招待エラー</CardTitle>
							</div>
							<CardDescription>招待の処理中にエラーが発生しました</CardDescription>
						</CardHeader>
						<CardContent>
							{errorMessage && (
								<div className="mb-6 rounded-md bg-destructive/10 p-4">
									<p className="text-sm text-destructive">{decodeURIComponent(errorMessage)}</p>
								</div>
							)}
							<div className="space-y-6">
								<div>
									<h3 className="font-semibold text-lg mb-3">考えられる原因：</h3>
									<ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
										<li>招待リンクの有効期限が切れている</li>
										<li>招待リンクが既に使用されている</li>
										<li>招待リンクの使用回数が上限に達している</li>
										<li>招待リンクが無効または存在しない</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold text-lg mb-3">対処方法：</h3>
									<ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
										<li>招待者に新しい招待リンクを発行してもらう</li>
										<li>招待者に連絡して状況を確認する</li>
										<li>既にメンバーの場合は、直接香典帳一覧からアクセスする</li>
									</ul>
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex gap-4">
							<Button asChild variant="default" size="lg">
								<Link href="/koudens">香典帳一覧へ</Link>
							</Button>
							<Button asChild variant="outline" size="lg">
								<Link href="/">トップページへ</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</main>
		</>
	);
}
