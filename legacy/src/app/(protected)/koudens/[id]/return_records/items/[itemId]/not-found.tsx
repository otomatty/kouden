import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";

/**
 * 返礼品詳細ページの404エラーページ
 */
export default function NotFound() {
	return (
		<div className="container max-w-2xl mx-auto px-4 py-12">
			<Card>
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl">返礼品が見つかりません</CardTitle>
				</CardHeader>
				<CardContent className="text-center space-y-6">
					<div className="space-y-2">
						<p className="text-muted-foreground">
							指定された返礼品が存在しないか、アクセス権限がありません。
						</p>
						<p className="text-sm text-muted-foreground">
							返礼品が削除されたか、URLが正しくない可能性があります。
						</p>
					</div>

					<div className="flex items-center justify-center space-x-2 text-muted-foreground">
						<Package className="h-5 w-5" />
						<span className="text-sm">返礼品詳細</span>
					</div>

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button variant="outline" asChild>
							<Link href="../">
								<ArrowLeft className="h-4 w-4 mr-2" />
								返礼品一覧に戻る
							</Link>
						</Button>
						<Button asChild>
							<Link href="../../">返礼品管理画面に戻る</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
