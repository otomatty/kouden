/**
 * お供物配分データ取得用のServer Actions
 */

"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OfferingAllocation } from "@/types/entries";

/**
 * 特定お供物の配分データを取得
 */
export async function getOfferingAllocations(
	offeringId: string,
): Promise<ActionResult<OfferingAllocation[]>> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		const { data, error } = await supabase
			.from("offering_allocations")
			.select(`
					id,
					offering_id,
					kouden_entry_id,
					allocated_amount,
					allocation_ratio,
					is_primary_contributor,
					contribution_notes,
					created_at,
					updated_at,
					created_by
				`)
			.eq("offering_id", offeringId)
			.order("created_at");

		if (error) throw error;

		return data || [];
	}, "お供物配分データの取得");
}

/**
 * 香典エントリーに関連するお供物配分を取得
 */
export async function getEntryOfferingAllocations(koudenEntryId: string): Promise<
	ActionResult<
		Array<
			OfferingAllocation & {
				offering_type: string;
				offering_price: number;
				provider_name: string;
			}
		>
	>
> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		const { data, error } = await supabase
			.from("offering_allocations")
			.select(`
					id,
					offering_id,
					kouden_entry_id,
					allocated_amount,
					allocation_ratio,
					is_primary_contributor,
					contribution_notes,
					created_at,
					updated_at,
					created_by,
					offerings (
						type,
						price,
						provider_name
					)
				`)
			.eq("kouden_entry_id", koudenEntryId)
			.order("created_at");

		if (error) throw error;

		// データの変換
		const transformedData =
			data?.map((allocation) => ({
				...allocation,
				offering_type: allocation.offerings?.type || "",
				offering_price: allocation.offerings?.price || 0,
				provider_name: allocation.offerings?.provider_name || "",
			})) || [];

		return transformedData;
	}, "香典エントリーの配分データ取得");
}

/**
 * お供物の配分整合性をチェック
 */
export async function checkOfferingAllocationIntegrity(offeringId?: string): Promise<
	ActionResult<
		Array<{
			offering_id: string;
			offering_type: string;
			offering_price: number;
			total_allocated: number;
			allocation_difference: number;
			ratio_sum: number;
			is_valid: boolean;
		}>
	>
> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// 配分整合性チェッククエリ
		let query = supabase.from("offerings").select(`
					id,
					type,
					price,
					offering_allocations (
						allocated_amount,
						allocation_ratio
					)
				`);

		if (offeringId) {
			query = query.eq("id", offeringId);
		}

		const { data, error } = await query;

		if (error) throw error;

		// 整合性データの計算
		const integrityData =
			data?.map((offering) => {
				const allocations = offering.offering_allocations || [];
				const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
				const ratioSum = allocations.reduce((sum, alloc) => sum + alloc.allocation_ratio, 0);
				const difference = offering.price - totalAllocated;

				return {
					offering_id: offering.id,
					offering_type: offering.type,
					offering_price: offering.price,
					total_allocated: totalAllocated,
					allocation_difference: difference,
					ratio_sum: ratioSum,
					is_valid: Math.abs(difference) <= 1 && Math.abs(ratioSum - 1.0) <= 0.001, // 1円以下と0.1%以下の誤差は許容
				};
			}) || [];

		return integrityData;
	}, "配分整合性チェック");
}

/**
 * 香典の合計金額を計算（香典 + 配分されたお供物）
 */
export async function calculateEntryTotalAmount(koudenEntryId: string): Promise<
	ActionResult<{
		kouden_amount: number;
		offering_total: number;
		calculated_total: number;
	}>
> {
	return withActionResult(async () => {
		const supabase = createAdminClient();

		// 香典エントリーの基本情報取得
		const { data: entry, error: entryError } = await supabase
			.from("kouden_entries")
			.select("amount")
			.eq("id", koudenEntryId)
			.single();

		if (entryError || !entry) {
			throw new KoudenError("香典エントリーが見つかりません", ErrorCodes.NOT_FOUND);
		}

		// 配分されたお供物の合計取得
		const { data: allocations, error: allocationError } = await supabase
			.from("offering_allocations")
			.select("allocated_amount")
			.eq("kouden_entry_id", koudenEntryId);

		if (allocationError) throw allocationError;

		const offeringTotal = allocations?.reduce((sum, alloc) => sum + alloc.allocated_amount, 0) || 0;

		return {
			kouden_amount: entry.amount,
			offering_total: offeringTotal,
			calculated_total: entry.amount + offeringTotal,
		};
	}, "合計金額の計算");
}

/**
 * 香典エントリーごとの合計金額情報（香典金額 + 配分されたお供物の合計）
 */
export type EntryAmountStats = {
	kouden_amount: number;
	offering_total: number;
	calculated_total: number;
};

/**
 * 複数の香典エントリーの合計金額を一括計算（N+1解消用）
 * 個別呼び出しの`calculateEntryTotalAmount`は単一エントリー向け（getUserDetail等）に残し、
 * リスト処理ではこちらを利用する。
 */
export async function calculateEntryTotalAmountBulk(
	koudenEntryIds: string[],
): Promise<ActionResult<Map<string, EntryAmountStats>>> {
	return withActionResult(async () => {
		if (koudenEntryIds.length === 0) {
			return new Map<string, EntryAmountStats>();
		}

		// 認証ユーザーを取得（Server Action は Client から任意の入力で呼べるため認可必須）
		const userClient = await createClient();
		const {
			data: { user },
			error: authError,
		} = await userClient.auth.getUser();
		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 管理者なら全エントリーへアクセス可能。それ以外は kouden 単位でアクセス権を確認する。
		// RPCエラーを silent に false 扱いすると、管理者が一般ユーザー扱いとなり認可フィルタで
		// すべての entry が落ち、空の Map が success: true で返るため、明示的にエラーを返す。
		const { data: isAdminFlag, error: rpcError } = await userClient.rpc("is_admin", {
			user_uid: user.id,
		});
		if (rpcError) {
			logger.error(
				{ error: rpcError.message, userId: user.id },
				"[calculateEntryTotalAmountBulk] is_admin RPC failed",
			);
			throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
		}
		const isAdmin = isAdminFlag === true;

		const supabase = createAdminClient();

		// kouden_id も含めて取得し、認可フィルタに使う
		const { data: rawEntries, error: entriesError } = await supabase
			.from("kouden_entries")
			.select("id, amount, kouden_id")
			.in("id", koudenEntryIds);

		if (entriesError) throw entriesError;

		let allowedEntries = rawEntries ?? [];
		if (!isAdmin) {
			// 所有 kouden + メンバー kouden の id 集合を取得。
			// どちらかが失敗した状態で進むと allowedKoudenIds が不正に空集合となり、
			// 全 entry を非認可として落として success:true で空 Map を返してしまうため、
			// 明示的にエラーを返す（is_admin RPC と同じ理由）。
			const [{ data: owned, error: ownedError }, { data: members, error: membersError }] =
				await Promise.all([
					supabase.from("koudens").select("id").eq("owner_id", user.id),
					supabase.from("kouden_members").select("kouden_id").eq("user_id", user.id),
				]);
			if (ownedError || membersError) {
				logger.error(
					{ ownedError, membersError, userId: user.id },
					"[calculateEntryTotalAmountBulk] auth-scope lookup failed",
				);
				throw new KoudenError("アクセス権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
			}
			const allowedKoudenIds = new Set<string>();
			for (const k of owned ?? []) allowedKoudenIds.add(k.id);
			for (const m of members ?? []) {
				if (m.kouden_id) allowedKoudenIds.add(m.kouden_id);
			}
			allowedEntries = allowedEntries.filter(
				(e) => e.kouden_id != null && allowedKoudenIds.has(e.kouden_id),
			);
			if (allowedEntries.length !== (rawEntries ?? []).length) {
				logger.warn(
					{
						filtered: (rawEntries ?? []).length - allowedEntries.length,
						userId: user.id,
					},
					"[calculateEntryTotalAmountBulk] filtered unauthorized entries",
				);
			}
		}

		const allowedEntryIds = allowedEntries.map((e) => e.id);
		if (allowedEntryIds.length === 0) {
			return new Map<string, EntryAmountStats>();
		}

		const { data: allocations, error: allocationError } = await supabase
			.from("offering_allocations")
			.select("kouden_entry_id, allocated_amount")
			.in("kouden_entry_id", allowedEntryIds);

		if (allocationError) throw allocationError;

		const totalsByEntry = new Map<string, number>();
		for (const alloc of allocations ?? []) {
			if (!alloc.kouden_entry_id) continue;
			const prev = totalsByEntry.get(alloc.kouden_entry_id) ?? 0;
			totalsByEntry.set(alloc.kouden_entry_id, prev + alloc.allocated_amount);
		}

		const data = new Map<string, EntryAmountStats>();
		for (const entry of allowedEntries) {
			const offeringTotal = totalsByEntry.get(entry.id) ?? 0;
			const koudenAmount = entry.amount ?? 0;
			data.set(entry.id, {
				kouden_amount: koudenAmount,
				offering_total: offeringTotal,
				calculated_total: koudenAmount + offeringTotal,
			});
		}

		return data;
	}, "合計金額の一括計算");
}
