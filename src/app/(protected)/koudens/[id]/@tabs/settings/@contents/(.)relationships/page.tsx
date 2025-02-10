import { getRelationships } from "@/app/_actions/relationships";
import { RelationshipsView } from "./_components/relationship-view";

interface RelationshipsPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 関係性設定ページ
 * - 香典帳の関係性設定を表示・編集するページ
 * - Suspense と ErrorBoundary を使用して非同期データ取得とエラーハンドリングを実装
 */
export default async function RelationshipsPage({ params }: RelationshipsPageProps) {
	const { id } = await params;
	const relationships = await getRelationships(id);

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">関係性設定</h2>
				<p className="text-sm text-muted-foreground">香典帳の関係性の設定を管理します</p>
			</div>

			<RelationshipsView koudenId={id} relationships={relationships} />
		</div>
	);
}
