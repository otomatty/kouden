export type SortedPageRpcRow = {
	id: string;
	total_count: number | string;
};

/**
 * RPC が返す各行に付与された total_count から全体件数を取り出す。
 */
export function totalCountFromSortedPageRows(rows: SortedPageRpcRow[]): number {
	return rows.length > 0 ? Number(rows[0].total_count) : 0;
}

/**
 * 計算列ソート用 RPC のページ結果から全体件数を解決する。
 *
 * RPC は LIMIT/OFFSET 後の行しか返さないため、範囲外ページでは行が 0 件でも
 * 全体件数は 0 とは限らない。offset > 0 で空ページのときだけ先頭 1 件を再取得して
 * total_count を復元する。
 */
export async function resolveSortedPageTotalCount(
	pageRows: SortedPageRpcRow[],
	pageOffset: number,
	fetchTotalCount: () => Promise<SortedPageRpcRow[]>,
): Promise<number> {
	if (pageRows.length > 0) {
		return totalCountFromSortedPageRows(pageRows);
	}

	if (pageOffset === 0) {
		return 0;
	}

	const probeRows = await fetchTotalCount();
	return totalCountFromSortedPageRows(probeRows);
}
