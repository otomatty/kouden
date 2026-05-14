/**
 * お供物配分データ取得用のServer Actions
 */

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OfferingAllocation } from "@/types/entries";

/**
 * 特定お供物の配分データを取得
 */
export async function getOfferingAllocations(offeringId: string): Promise<{
	success: boolean;
	data?: OfferingAllocation[];
	error?: string;
}> {
	try {
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

		if (error) {
			return {
				success: false,
				error: `配分データの取得に失敗しました: ${error.message}`,
			};
		}

		return {
			success: true,
			data: data || [],
		};
	} catch (error) {
		console.error("お供物配分取得エラー:", error);
		return {
			success: false,
			error: "配分データの取得に失敗しました",
		};
	}
}

/**
 * 香典エントリーに関連するお供物配分を取得
 */
export async function getEntryOfferingAllocations(koudenEntryId: string): Promise<{
	success: boolean;
	data?: Array<
		OfferingAllocation & {
			offering_type: string;
			offering_price: number;
			provider_name: string;
		}
	>;
	error?: string;
}> {
	try {
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

		if (error) {
			return {
				success: false,
				error: `配分データの取得に失敗しました: ${error.message}`,
			};
		}

		// データの変換
		const transformedData =
			data?.map((allocation) => ({
				...allocation,
				offering_type: allocation.offerings?.type || "",
				offering_price: allocation.offerings?.price || 0,
				provider_name: allocation.offerings?.provider_name || "",
			})) || [];

		return {
			success: true,
			data: transformedData,
		};
	} catch (error) {
		console.error("香典エントリー配分取得エラー:", error);
		return {
			success: false,
			error: "香典エントリーの配分データ取得に失敗しました",
		};
	}
}

/**
 * お供物の配分整合性をチェック
 */
export async function checkOfferingAllocationIntegrity(offeringId?: string): Promise<{
	success: boolean;
	data?: Array<{
		offering_id: string;
		offering_type: string;
		offering_price: number;
		total_allocated: number;
		allocation_difference: number;
		ratio_sum: number;
		is_valid: boolean;
	}>;
	error?: string;
}> {
	try {
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

		if (error) {
			return {
				success: false,
				error: `整合性チェックに失敗しました: ${error.message}`,
			};
		}

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

		return {
			success: true,
			data: integrityData,
		};
	} catch (error) {
		console.error("配分整合性チェックエラー:", error);
		return {
			success: false,
			error: "配分整合性チェックに失敗しました",
		};
	}
}

/**
 * 香典の合計金額を計算（香典 + 配分されたお供物）
 */
export async function calculateEntryTotalAmount(koudenEntryId: string): Promise<{
	success: boolean;
	data?: {
		kouden_amount: number;
		offering_total: number;
		calculated_total: number;
	};
	error?: string;
}> {
	try {
		const supabase = createAdminClient();

		// 香典エントリーの基本情報取得
		const { data: entry, error: entryError } = await supabase
			.from("kouden_entries")
			.select("amount")
			.eq("id", koudenEntryId)
			.single();

		if (entryError || !entry) {
			return {
				success: false,
				error: "香典エントリーが見つかりません",
			};
		}

		// 配分されたお供物の合計取得
		const { data: allocations, error: allocationError } = await supabase
			.from("offering_allocations")
			.select("allocated_amount")
			.eq("kouden_entry_id", koudenEntryId);

		if (allocationError) {
			return {
				success: false,
				error: "お供物配分データの取得に失敗しました",
			};
		}

		const offeringTotal = allocations?.reduce((sum, alloc) => sum + alloc.allocated_amount, 0) || 0;

		return {
			success: true,
			data: {
				kouden_amount: entry.amount,
				offering_total: offeringTotal,
				calculated_total: entry.amount + offeringTotal,
			},
		};
	} catch (error) {
		console.error("合計金額計算エラー:", error);
		return {
			success: false,
			error: "合計金額の計算に失敗しました",
		};
	}
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
export async function calculateEntryTotalAmountBulk(koudenEntryIds: string[]): Promise<{
	success: boolean;
	data?: Map<string, EntryAmountStats>;
	error?: string;
}> {
	try {
		if (koudenEntryIds.length === 0) {
			return { success: true, data: new Map() };
		}

		// 認証ユーザーを取得（Server Action は Client から任意の入力で呼べるため認可必須）
		const userClient = await createClient();
		const {
			data: { user },
			error: authError,
		} = await userClient.auth.getUser();
		if (authError || !user) {
			return { success: false, error: "認証が必要です" };
		}

		// 管理者なら全エントリーへアクセス可能。それ以外は kouden 単位でアクセス権を確認する。
		const { data: isAdminFlag } = await userClient.rpc("is_admin", { user_uid: user.id });
		const isAdmin = isAdminFlag === true;

		const supabase = createAdminClient();

		// kouden_id も含めて取得し、認可フィルタに使う
		const { data: rawEntries, error: entriesError } = await supabase
			.from("kouden_entries")
			.select("id, amount, kouden_id")
			.in("id", koudenEntryIds);

		if (entriesError) {
			return { success: false, error: "香典エントリーの取得に失敗しました" };
		}

		let allowedEntries = rawEntries ?? [];
		if (!isAdmin) {
			// 所有 kouden + メンバー kouden の id 集合を取得
			const [{ data: owned }, { data: members }] = await Promise.all([
				supabase.from("koudens").select("id").eq("owner_id", user.id),
				supabase.from("kouden_members").select("kouden_id").eq("user_id", user.id),
			]);
			const allowedKoudenIds = new Set<string>();
			for (const k of owned ?? []) allowedKoudenIds.add(k.id);
			for (const m of members ?? []) {
				if (m.kouden_id) allowedKoudenIds.add(m.kouden_id);
			}
			allowedEntries = allowedEntries.filter(
				(e) => e.kouden_id != null && allowedKoudenIds.has(e.kouden_id),
			);
			if (allowedEntries.length !== (rawEntries ?? []).length) {
				console.warn(
					`[calculateEntryTotalAmountBulk] filtered ${(rawEntries ?? []).length - allowedEntries.length} unauthorized entries for user ${user.id}`,
				);
			}
		}

		const allowedEntryIds = allowedEntries.map((e) => e.id);
		if (allowedEntryIds.length === 0) {
			return { success: true, data: new Map() };
		}

		const { data: allocations, error: allocationError } = await supabase
			.from("offering_allocations")
			.select("kouden_entry_id, allocated_amount")
			.in("kouden_entry_id", allowedEntryIds);

		if (allocationError) {
			return { success: false, error: "お供物配分データの取得に失敗しました" };
		}

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

		return { success: true, data };
	} catch (error) {
		console.error("合計金額一括計算エラー:", error);
		return {
			success: false,
			error: "合計金額の一括計算に失敗しました",
		};
	}
}
