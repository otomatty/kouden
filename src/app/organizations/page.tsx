import Link from "next/link";
import Container from "@/components/ui/container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, ClipboardList, LifeBuoy } from "lucide-react";

export default function OrganizationsPage() {
	return (
		<Container className="py-8">
			<h1 className="text-2xl font-bold mb-6">管理システム</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Link href="/organizations/request" className="no-underline">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="items-center text-center">
							<UserPlus className="w-8 h-8 text-blue-500 mx-auto mb-2" />
							<CardTitle>法人アカウント申請</CardTitle>
							<CardDescription>新規に法人アカウントを申請します</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link href="/organizations/status" className="no-underline">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="items-center text-center">
							<ClipboardList className="w-8 h-8 text-green-500 mx-auto mb-2" />
							<CardTitle>申請状況確認</CardTitle>
							<CardDescription>現在の申請ステータスを確認します</CardDescription>
						</CardHeader>
					</Card>
				</Link>
				<Link href="/contact" className="no-underline">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="items-center text-center">
							<LifeBuoy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
							<CardTitle>お問い合わせ</CardTitle>
							<CardDescription>サポートへのお問い合わせはこちら</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</Container>
	);
}
