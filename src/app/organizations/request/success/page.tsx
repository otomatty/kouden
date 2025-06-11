import Container from "@/components/ui/container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, User, ClipboardList } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ContactSection from "@/app/organizations/_components/ContactSection";

export default function SuccessPage() {
	return (
		<Container className="py-8">
			<div className="text-center space-y-6">
				<div className="flex flex-col items-center py-12">
					<h1 className="text-2xl font-semibold mb-2">リクエストを受け付けました</h1>
					<p>管理者の承認をお待ちください。</p>
				</div>
				<div className="space-y-4 text-left">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
						<Card>
							<CardHeader className="items-center text-center">
								<Clock className="w-8 h-8 text-blue-500 mb-2" />
								<CardTitle>管理者が承認するのを待つ</CardTitle>
								<CardDescription>通常24時間以内に承認されます。</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="items-center text-center">
								<User className="w-8 h-8 text-green-500 mb-2" />
								<CardTitle>承認後、組織にアクセスできるようになります</CardTitle>
								<CardDescription>承認され次第、ダッシュボードへ移動します。</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="items-center text-center">
								<ClipboardList className="w-8 h-8 text-yellow-500 mb-2" />
								<CardTitle>申請状況は以下からいつでも確認できます</CardTitle>
								<CardDescription>ステータスページでリアルタイムに確認可能です。</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
				<Button asChild className="mt-6">
					<Link href="/organizations/status">申請状況を確認する</Link>
				</Button>
			</div>
			{/* Contact Information Section */}
			<ContactSection />
		</Container>
	);
}
