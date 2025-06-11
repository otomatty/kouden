import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LifeBuoy, Mail, Clock } from "lucide-react";

export default function ContactSection() {
	return (
		<div className="mt-12 text-left">
			<h2 className="text-xl font-semibold mb-4">お問い合わせ</h2>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="items-center text-center">
						<LifeBuoy className="w-8 h-8 text-blue-500 mb-2" />
						<CardTitle>お問い合わせフォーム</CardTitle>
						<CardDescription>
							<Link href="/contact" className="text-blue-500 underline">
								お問い合わせフォームはこちら
							</Link>
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="items-center text-center">
						<Mail className="w-8 h-8 text-green-500 mb-2" />
						<CardTitle>メールアドレス</CardTitle>
						<CardDescription>
							<a href="mailto:saedgewell@gmail.com" className="text-blue-500 underline">
								saedgewell@gmail.com
							</a>
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="items-center text-center">
						<Clock className="w-8 h-8 text-yellow-500 mb-2" />
						<CardTitle>対応可能時間</CardTitle>
						<CardDescription>平日 9:00〜18:00</CardDescription>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
