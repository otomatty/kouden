import { EntryView } from "./_components";
import { getEntries } from "@/app/_actions/entries";
import { getRelationships } from "@/app/_actions/relationships";

/**
 * 香典帳（entries）のページコンポーネント
 * - 香典情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 */
export default async function EntriesPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
	const { id: koudenId } = await params;
	const { page: pageStr, pageSize: pageSizeStr } = await searchParams;
	const page = pageStr ? Number.parseInt(pageStr, 10) : 1;
	const pageSize = pageSizeStr ? Number.parseInt(pageSizeStr, 10) : 50;
	const [{ entries, count }, relationships] = await Promise.all([
		getEntries(koudenId, page, pageSize),
		getRelationships(koudenId),
	]);

	return (
		<div className="mt-4">
			<EntryView
				koudenId={koudenId}
				entries={entries}
				relationships={relationships}
				totalCount={count}
				currentPage={page}
				pageSize={pageSize}
			/>
		</div>
	);
}
