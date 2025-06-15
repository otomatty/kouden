import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import EntriesPageClient from "@/app/(protected)/koudens/[id]/entries/EntriesPageClient";
import { getEntriesForAdmin } from "@/app/_actions/entries";
import { getRelationshipsForAdmin } from "@/app/_actions/relationships";

/**
 * 管理者用香典帳（entries）のページコンポーネント
 * - 香典情報の一覧を表示
 * - テーブル/カードリスト形式で表示
 * - 管理者権限でアクセス
 */
export default async function AdminEntriesPage({
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

	// 管理者権限チェック
	await checkAdminPermission();

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

	console.log("[DEBUG] Admin Entries Page - Parameters:", {
		koudenId,
		page,
		pageSize,
		memberIds,
		searchValue,
		sortValue,
		dateFromValue,
		dateToValue,
		showDuplicates,
	});

	try {
		const [{ entries, count }, relationships] = await Promise.all([
			getEntriesForAdmin(
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
			getRelationshipsForAdmin(koudenId),
		]);

		console.log("[DEBUG] Admin Entries Page - Data fetched:", {
			entriesCount: entries.length,
			totalCount: count,
			relationshipsCount: relationships.length,
			firstEntry: entries[0] || null,
			firstRelationship: relationships[0] || null,
		});

		return (
			<div className="mt-4">
				<EntriesPageClient
					koudenId={koudenId}
					entries={entries}
					relationships={relationships}
					totalCount={count}
					currentPage={page}
					pageSize={pageSize}
					isAdminMode={true}
				/>
			</div>
		);
	} catch (error) {
		console.error("[ERROR] Admin Entries Page - Failed to fetch data:", error);

		// エラー情報を表示するための簡単なUI
		return (
			<div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
				<h2 className="text-lg font-semibold text-red-800 mb-2">データ取得エラー</h2>
				<p className="text-red-700 mb-2">香典情報の取得に失敗しました。</p>
				<details className="text-sm text-red-600">
					<summary className="cursor-pointer font-medium">エラー詳細</summary>
					<pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
						{error instanceof Error ? error.message : String(error)}
					</pre>
				</details>
			</div>
		);
	}
}
