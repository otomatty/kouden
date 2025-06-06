import { getReturnItems } from "@/app/_actions/return-records/return-items";
import { ReturnItemsView } from "./_components/return-items-view";

interface ReturnItemsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 返礼品設定ページ
 * - 香典帳の返礼品マスタの表示・編集
 * - 返礼品の追加、編集、削除の管理
 * - Suspense と ErrorBoundary を使用して非同期データ取得とエラーハンドリングを実装
 */
export default async function ReturnItemsPage({ params }: ReturnItemsPageProps) {
	const { id: koudenId } = await params;
	const returnItems = await getReturnItems(koudenId);

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">返礼品設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の返礼品を管理します</p>
			</div>

			<ReturnItemsView koudenId={koudenId} returnItems={returnItems} />
		</div>
	);
}
