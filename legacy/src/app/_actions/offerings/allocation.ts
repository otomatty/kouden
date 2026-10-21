/**
 * お供物配分管理のServer Actions
 * 新しいoffering_allocationsテーブルを使用した配分システム
 */

"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OfferingAllocationRequest } from "@/types/entries";
import { revalidatePath } from "next/cache";

/**
 * お供物を複数の香典エントリーに配分する
 */
export async function allocateOfferingToEntries(
	request: OfferingAllocationRequest,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// お供物の価格を取得
		const { data: offering, error: offeringError } = await supabase
			.from("offerings")
			.select("price")
			.eq("id", request.offering_id)
			.single();

		if (offeringError || !offering) {
			throw new KoudenError("お供物が見つかりません", ErrorCodes.NOT_FOUND);
		}

		// 既存の配分があれば削除
		await supabase.from("offering_allocations").delete().eq("offering_id", request.offering_id);

		// 配分金額の計算
		const allocations = calculateAllocations(
			offering.price,
			request.kouden_entry_ids,
			request.allocation_method,
			request.manual_amounts,
		);

		// 配分データの挿入
		const allocationData = allocations.map((allocation, index) => ({
			offering_id: request.offering_id,
			kouden_entry_id: request.kouden_entry_ids[index],
			allocated_amount: allocation.amount,
			allocation_ratio: allocation.ratio,
			is_primary_contributor:
				request.kouden_entry_ids[index] === request.primary_contributor_id ||
				(index === 0 && !request.primary_contributor_id),
		}));

		const { error: insertError } = await supabase
			.from("offering_allocations")
			.insert(allocationData);

		if (insertError) throw insertError;

		// 関連する香典エントリーの has_offering フラグを更新
		await supabase
			.from("kouden_entries")
			.update({ has_offering: true })
			.in("id", request.kouden_entry_ids);

		revalidatePath("/koudens");
		return null;
	}, "お供物の配分");
}

/**
 * 配分の削除
 */
export async function removeOfferingAllocation(offeringId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// 配分対象の香典エントリーIDを取得
		const { data: allocations } = await supabase
			.from("offering_allocations")
			.select("kouden_entry_id")
			.eq("offering_id", offeringId);

		const koudenEntryIds = allocations?.map((a) => a.kouden_entry_id) || [];

		// 配分データを削除
		const { error: deleteError } = await supabase
			.from("offering_allocations")
			.delete()
			.eq("offering_id", offeringId);

		if (deleteError) throw deleteError;

		// 他にお供物がない香典エントリーの has_offering フラグを更新
		for (const entryId of koudenEntryIds.filter((id): id is string => id !== null)) {
			const { data: remainingAllocations } = await supabase
				.from("offering_allocations")
				.select("id")
				.eq("kouden_entry_id", entryId)
				.limit(1);

			if (!remainingAllocations || remainingAllocations.length === 0) {
				await supabase.from("kouden_entries").update({ has_offering: false }).eq("id", entryId);
			}
		}

		revalidatePath("/koudens");
		return null;
	}, "お供物配分の削除");
}

/**
 * 配分の再計算（既存の配分を新しい方法で再配分）
 */
export async function recalculateOfferingAllocation(
	offeringId: string,
	newAllocationMethod: "equal" | "weighted" | "manual",
	manualAmounts?: number[],
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// 現在の配分データを取得
		const { data: currentAllocations } = await supabase
			.from("offering_allocations")
			.select("kouden_entry_id, is_primary_contributor")
			.eq("offering_id", offeringId)
			.order("created_at");

		if (!currentAllocations || currentAllocations.length === 0) {
			throw new KoudenError("配分データが見つかりません", ErrorCodes.NOT_FOUND);
		}

		const koudenEntryIds = currentAllocations
			.map((a) => a.kouden_entry_id)
			.filter((id): id is string => id !== null);
		const primaryContributorId =
			currentAllocations.find((a) => a.is_primary_contributor)?.kouden_entry_id ?? undefined;

		// 新しい配分方法で再配分
		const result = await allocateOfferingToEntries({
			offering_id: offeringId,
			kouden_entry_ids: koudenEntryIds,
			allocation_method: newAllocationMethod,
			manual_amounts: manualAmounts,
			primary_contributor_id: primaryContributorId,
		});

		if (!result.ok) {
			// allocateOfferingToEntries 内で発生したエラーを上位に伝播させる
			throw new KoudenError(result.error.message, result.error.code, {
				status: result.error.status,
			});
		}

		return null;
	}, "お供物配分の再計算");
}

/**
 * 配分金額の計算ヘルパー関数（純粋関数）
 */
function calculateAllocations(
	totalPrice: number,
	entryIds: string[],
	method: "equal" | "weighted" | "manual",
	manualAmounts?: number[],
): Array<{ amount: number; ratio: number }> {
	const entryCount = entryIds.length;

	switch (method) {
		case "equal": {
			const equalAmount = Math.floor(totalPrice / entryCount);
			const remainder = totalPrice % entryCount;

			return entryIds.map((_, index) => {
				const amount = equalAmount + (index < remainder ? 1 : 0);
				return {
					amount,
					ratio: amount / totalPrice,
				};
			});
		}

		case "manual": {
			if (!manualAmounts || manualAmounts.length !== entryCount) {
				throw new KoudenError(
					"手動配分の場合、全てのエントリーに金額を指定してください",
					ErrorCodes.VALIDATION_ERROR,
				);
			}

			const manualTotal = manualAmounts.reduce((sum, amount) => sum + amount, 0);
			if (manualTotal !== totalPrice) {
				throw new KoudenError(
					`配分金額の合計（${manualTotal}円）がお供物価格（${totalPrice}円）と一致しません`,
					ErrorCodes.VALIDATION_ERROR,
				);
			}

			return manualAmounts.map((amount) => ({
				amount,
				ratio: amount / totalPrice,
			}));
		}

		case "weighted":
			// 将来実装: 香典金額に応じた重み付け配分
			// 現在は均等配分として処理
			return calculateAllocations(totalPrice, entryIds, "equal");

		default:
			throw new KoudenError(`未対応の配分方法: ${method}`, ErrorCodes.INVALID_OPERATION);
	}
}
