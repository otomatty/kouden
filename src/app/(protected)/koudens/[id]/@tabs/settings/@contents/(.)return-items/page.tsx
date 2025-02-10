import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReturnItemTable } from "./_components/table/table";
import { getReturnItems } from "@/app/_actions/return-records/return-items";

interface ReturnItemsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 返礼品設定ページ
 * - 香典帳の返礼品マスタの表示・編集
 * - 返礼品の追加、編集、削除の管理
 */
export default async function ReturnItemsPage({ params }: ReturnItemsPageProps) {
	const { id: koudenId } = await params;
	const returnItems = await getReturnItems(koudenId);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">返礼品設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の返礼品を管理します</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>返礼品一覧</CardTitle>
					<CardDescription>返礼品の追加、編集、削除ができます</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<ReturnItemTable koudenId={koudenId} returnItems={returnItems} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
