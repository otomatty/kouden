import { PageHero } from "@/app/(public)/_components/page-hero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContactSuccessPage() {
	return (
		<>
			<PageHero
				title="送信完了"
				subtitle="お問い合わせありがとうございます。"
				className="bg-background"
			/>
			<div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>未ログインユーザーの流れ</CardTitle>
						<CardDescription>
							ログインせずにお問い合わせいただいた場合、メールにてご返信いたします。
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="list-disc list-inside space-y-1">
							<li>お問い合わせフォームを送信</li>
							<li>ご入力いただいたメールアドレス宛に返信</li>
							<li>メール本文に記載のリンクから回答を確認</li>
						</ul>
						<p className="mt-4 text-sm text-muted-foreground">
							メール受信までに最大24時間程度かかる場合があります。
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>認証済みユーザーの流れ</CardTitle>
						<CardDescription>
							ログイン済みの場合、メールまたはアプリ内メッセージでご返信いたします。そしてアプリ内でも履歴を確認可能です。
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="list-disc list-inside space-y-1">
							<li>お問い合わせフォームを送信</li>
							<li>メール通知またはアプリ内通知を受信</li>
							<li>アプリの「お問い合わせ履歴」から回答を確認</li>
						</ul>
						<p className="mt-4 text-sm text-muted-foreground">
							アプリ内では過去の問い合わせ履歴も一覧で確認できます。
						</p>
					</CardContent>
				</Card>
			</div>
			<div className="container mx-auto px-4 py-4 flex justify-center">
				<Button asChild>
					<Link href="/">ホームに戻る</Link>
				</Button>
			</div>
		</>
	);
}
