import { redirect, notFound } from "next/navigation";
import { getKouden } from "@/app/_actions/koudens";
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
	searchParams: Promise<{
		page?: string;
		pageSize?: string;
		memberIds?: string;
		search?: string;
		sort?: string;
		dateFrom?: string;
		dateTo?: string;
		isDuplicate?: string;
	}>;
}) {
	const { id: koudenId } = await params;
	const rawSearchParams = await searchParams;
	const {
		page: pageStr,
		pageSize: pageSizeStr,
		memberIds: memberIdsStr,
		search: searchValue,
		sort: sortValue,
		dateFrom,
		dateTo,
	} = rawSearchParams;
	const page = pageStr ? Number.parseInt(pageStr, 10) : 1;
	const pageSize = pageSizeStr ? Number.parseInt(pageSizeStr, 10) : 50;
	const memberIds = memberIdsStr
		? memberIdsStr
				.split(",")
				.map((id) => id.trim())
				.filter(Boolean)
		: undefined;
	const dateFromValue = dateFrom ?? undefined;
	const dateToValue = dateTo ?? undefined;
	const showDuplicates = rawSearchParams.isDuplicate === "true";
	const [{ entries, count }, relationships] = await Promise.all([
		getEntries(
			koudenId,
			page,
			pageSize,
			memberIds,
			searchValue,
			sortValue,
			dateFromValue,
			dateToValue,
			showDuplicates,
		),
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
