/**
 * 返礼サマリー組み立て用のServer Action
 * - お供物配分金額の一括取得 (`calculateEntryTotalAmountBulk`) と
 *   `convertToReturnManagementSummary` の純粋変換を組み合わせ、
 *   N+1 を避けつつ ReturnManagementSummary 配列を構築する。
 * - 純粋変換ロジックは `@/utils/return-records-helpers` 側に残し、
 *   このファイルは Server Action としてのデータ取得責務を担う。
 */

"use server";

import { calculateEntryTotalAmountBulk } from "@/app/_actions/offerings/queries";
import { type ActionResult, KoudenError, withActionResult } from "@/lib/errors";
import type { Entry } from "@/types/entries";
import type { Relationship } from "@/types/relationships";
import type {
	ReturnEntryRecord,
	ReturnManagementSummary,
} from "@/types/return-records/return-records";
import { convertToReturnManagementSummary } from "@/utils/return-records-helpers";

export async function convertToReturnManagementSummaries(
	returnRecords: ReturnEntryRecord[],
	entries: Entry[],
	relationships: Relationship[],
	koudenId: string,
): Promise<ActionResult<ReturnManagementSummary[]>> {
	return withActionResult(async () => {
		const entryIds = Array.from(
			new Set(
				returnRecords
					.map((r) => r.kouden_entry_id)
					.filter((id): id is string => typeof id === "string" && id.length > 0),
			),
		);

		const bulk = await calculateEntryTotalAmountBulk(entryIds);
		if (!bulk.ok) {
			// 失敗時は明示的に例外を投げる（誤った返礼サマリー表示を防ぐ）。
			throw new KoudenError(bulk.error.message, bulk.error.code);
		}
		const amountsMap = bulk.data;

		return returnRecords
			.map((record) =>
				convertToReturnManagementSummary(record, entries, relationships, koudenId, amountsMap),
			)
			.filter((summary): summary is ReturnManagementSummary => summary !== null);
	}, "返礼サマリーの構築");
}
