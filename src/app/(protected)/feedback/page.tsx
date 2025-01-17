import { FeedbackForm } from "@/components/custom/feedback-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
	title: "フィードバック | 香典帳アプリ",
	description: "香典帳アプリについてのフィードバックをお寄せください。",
};

export default function FeedbackPage() {
	return (
		<div className="container py-8">
			<div className="mb-6">
				<Link href="/koudens">
					<Button variant="ghost" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						香典帳一覧に戻る
					</Button>
				</Link>
			</div>
			<FeedbackForm />
		</div>
	);
}
