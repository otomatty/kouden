import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function KoudenNotFound() {
	return (
		<div className="flex h-full flex-col items-center justify-center space-y-4">
			<h2 className="text-2xl font-bold">香典帳が見つかりません</h2>
			<p className="text-muted-foreground">
				指定された香典帳は存在しないか、アクセス権限がありません。
			</p>
			<Button variant="ghost" className="flex items-center gap-2" asChild>
				<Link href="/koudens">
					<ArrowLeft className="h-4 w-4" />
					<span>一覧に戻る</span>
				</Link>
			</Button>
		</div>
	);
}
