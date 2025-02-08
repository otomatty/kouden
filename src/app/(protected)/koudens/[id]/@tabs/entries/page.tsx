import { EntryView } from "./_components";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";

interface EntriesPageProps {
	params: Promise<{ id: string }>;
}

/**
 * 香典帳（entries）のページコンポーネント
 * - 香典情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 */
export default async function EntriesPage({ params }: EntriesPageProps) {
	const { id: koudenId } = await params;
	// 必要なデータのみを取得
	const [entries, relationships] = await Promise.all([
		getEntries(koudenId),
		getRelationships(koudenId),
	]);

	return <EntryView koudenId={koudenId} entries={entries} relationships={relationships} />;
}
