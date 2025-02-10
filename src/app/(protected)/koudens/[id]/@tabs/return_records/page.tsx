import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Construction } from "lucide-react";

/**
 * 返礼品管理画面
 * - 現在開発中であることを示すメッセージを表示
 * - 今後実装予定の機能の概要を表示
 */
export default function ReturnRecordsPage() {
	return (
		<div className="container mx-auto p-4 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>返礼品管理</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<Construction className="h-4 w-4" />
						<AlertTitle>開発中</AlertTitle>
						<AlertDescription>
							返礼品管理機能は現在開発中です。以下の機能を実装予定です：
							<ul className="list-disc list-inside mt-2 space-y-1">
								<li>返礼品の登録・編集・削除</li>
								<li>返礼品の在庫管理</li>
								<li>返礼品の発送状況管理</li>
								<li>返礼品の統計情報</li>
							</ul>
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	);
}
