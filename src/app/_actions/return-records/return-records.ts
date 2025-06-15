"use server";

/**
 * 返礼情報に関するServer Actions
 * @module return-records
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	ReturnEntryRecord,
	ReturnEntryRecordWithKoudenEntry,
	ReturnStatus,
	CreateReturnEntryInput,
	UpdateReturnEntryInput,
	BulkUpdateConfig,
	ReturnManagementSummary,
	ReturnItem,
} from "@/types/return-records/return-records";

/**
 * 返礼記録の更新可能フィールドの値の型定義
 */
type ReturnRecordFieldValue =
	| ReturnStatus // return_status
	| number // funeral_gift_amount, additional_return_amount, return_items_cost
	| string // return_method, arrangement_date, remarks, shipping_postal_code, shipping_address, shipping_phone_number
	| boolean // for compatibility with CellValue type
	| null; // nullable fields

/**
 * 返礼情報を作成する
 * @param {CreateReturnEntryInput} input - 作成する返礼情報
 * @returns {Promise<ReturnEntryRecord>} 作成された返礼情報
 * @throws {Error} 認証エラーまたは作成失敗時のエラー
 */
export async function createReturnEntry(input: CreateReturnEntryInput): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.insert({
				kouden_entry_id: input.kouden_entry_id,
				return_status: input.return_status || "PENDING",
				return_items: JSON.parse(JSON.stringify(input.return_items || [])),
				funeral_date: input.funeral_date,
				remarks: input.remarks,
				created_by: user.id,
			})
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼情報の作成に失敗しました");
		}

		// キャッシュの再検証
		const entryData = await supabase
			.from("kouden_entries")
			.select("kouden_id")
			.eq("id", input.kouden_entry_id)
			.single();

		if (entryData.data) {
			revalidatePath(`/koudens/${entryData.data.kouden_id}`);
		}

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報の作成エラー:", error);
		throw error;
	}
}

/**
 * 香典エントリーIDに紐づく返礼情報を取得する
 * @param {string} koudenEntryId - 香典エントリーID
 * @returns {Promise<ReturnEntryRecord | null>} 返礼情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntryRecord(
	koudenEntryId: string,
): Promise<ReturnEntryRecord | null> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_entry_records")
			.select("*")
			.eq("kouden_entry_id", koudenEntryId)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 = not found
			throw error;
		}

		return data as ReturnEntryRecord | null;
	} catch (error) {
		console.error("返礼情報の取得エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく全ての返礼情報を取得する
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnEntryRecord[]>} 返礼情報一覧
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntriesByKouden(koudenId: string): Promise<ReturnEntryRecord[]> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnEntryRecord[];
	} catch (error) {
		console.error("返礼情報一覧の取得エラー:", error);
		throw error;
	}
}

/**
 * 香典帳IDに紐づく返礼情報をページング付きで取得する（無限スクロール用）
 * @param {string} koudenId - 香典帳ID
 * @param {number} limit - 取得件数（デフォルト100件）
 * @param {string} [cursor] - カーソル（最後のレコードのID）
 * @param {Object} filters - フィルター条件
 * @param {string} [filters.search] - 検索キーワード
 * @param {string} [filters.status] - ステータスフィルター
 * @returns {Promise<{ data: ReturnEntryRecord[], hasMore: boolean, nextCursor?: string }>} ページング付き返礼情報
 * @throws {Error} 取得失敗時のエラー
 */
export async function getReturnEntriesByKoudenPaginated(
	koudenId: string,
	limit = 100,
	cursor?: string,
	filters?: {
		search?: string;
		status?: string;
	},
): Promise<{ data: ReturnEntryRecordWithKoudenEntry[]; hasMore: boolean; nextCursor?: string }> {
	try {
		const supabase = await createClient();

		let query = supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					kouden_id,
					name,
					organization,
					position
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false })
			.limit(limit + 1); // 次のページがあるかチェックするため+1

		// カーソル（ページング）
		if (cursor) {
			query = query.lt("created_at", cursor);
		}

		// ステータスフィルター
		if (filters?.status && filters.status !== "all") {
			query = query.eq("return_status", filters.status);
		}

		// 検索フィルター（エントリー名または組織名）
		if (filters?.search) {
			query = query.or(
				`kouden_entries.name.ilike.%${filters.search}%,kouden_entries.organization.ilike.%${filters.search}%`,
			);
		}

		const { data, error } = await query;

		if (error) {
			throw error;
		}

		const records = data as ReturnEntryRecordWithKoudenEntry[];
		const hasMore = records.length > limit;
		const actualData = hasMore ? records.slice(0, limit) : records;
		const nextCursor = hasMore ? actualData[actualData.length - 1]?.created_at : undefined;

		return {
			data: actualData,
			hasMore,
			nextCursor,
		};
	} catch (error) {
		console.error("返礼情報一覧の取得エラー（ページング）:", error);
		throw error;
	}
}

/**
 * 一括変更用：香典帳の全返礼記録を取得する（ReturnManagementSummary形式）
 * @param {string} koudenId - 香典帳ID
 * @returns {Promise<ReturnManagementSummary[]>} 全返礼記録のサマリー
 * @throws {Error} 認証エラーまたは取得失敗時のエラー
 */
export async function getAllReturnRecordsForBulkUpdate(
	koudenId: string,
): Promise<ReturnManagementSummary[]> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 全返礼記録を取得（制限なし）
		const { data: returnRecords, error } = await supabase
			.from("return_entry_records")
			.select(`
				*,
				kouden_entries!inner (
					id,
					kouden_id,
					name,
					organization,
					position,
					amount,
					has_offering,
					relationship_id,
					attendance_type
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		// 関係性情報を別途取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name")
			.eq("kouden_id", koudenId);

		if (relationshipsError) {
			throw relationshipsError;
		}

		// ReturnManagementSummary形式に変換
		const summaries: ReturnManagementSummary[] = returnRecords.map((record) => {
			const entry = record.kouden_entries;
			const returnItems: ReturnItem[] = Array.isArray(record.return_items)
				? (record.return_items as unknown as ReturnItem[])
				: [];

			// 関係性名を取得
			const relationship = relationships?.find((r) => r.id === entry.relationship_id);

			return {
				koudenId: koudenId,
				koudenEntryId: record.kouden_entry_id,
				entryName: entry.name || "",
				organization: entry.organization || "",
				entryPosition: entry.position || "",
				relationshipName: relationship?.name || "",
				koudenAmount: entry.amount || 0,
				offeringCount: entry.has_offering ? 1 : 0,
				offeringTotal: entry.has_offering ? 1000 : 0, // 仮の値
				totalAmount: (entry.amount || 0) + (entry.has_offering ? 1000 : 0),
				returnStatus: record.return_status as ReturnStatus,
				funeralGiftAmount: record.funeral_gift_amount || 0,
				additionalReturnAmount: record.additional_return_amount || 0,
				returnMethod: record.return_method || "",
				returnItems: returnItems,
				arrangementDate: record.arrangement_date || "",
				remarks: record.remarks || "",
				returnRecordCreated: record.created_at,
				returnRecordUpdated: record.updated_at,
				statusDisplay: record.return_status,
				needsAdditionalReturn: (record.additional_return_amount || 0) > 0,
				shippingPostalCode: record.shipping_postal_code || undefined,
				shippingAddress: record.shipping_address || undefined,
				shippingPhoneNumber: record.shipping_phone_number || undefined,
				returnItemsCost: record.return_items_cost || 0,
				profitLoss: record.profit_loss || 0,
			} satisfies ReturnManagementSummary;
		});

		return summaries;
	} catch (error) {
		console.error("一括変更用全返礼記録の取得エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を更新する
 * @param {UpdateReturnEntryInput & { kouden_id: string }} input - 更新する返礼情報
 * @returns {Promise<ReturnEntryRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnEntry(
	input: UpdateReturnEntryInput & { kouden_id: string },
): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		const { kouden_entry_id, kouden_id, ...updateData } = input;

		if (!kouden_entry_id) {
			throw new Error("香典エントリーIDが指定されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.update({
				...updateData,
				return_items: updateData.return_items
					? JSON.parse(JSON.stringify(updateData.return_items))
					: undefined,
			})
			.eq("kouden_entry_id", kouden_entry_id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼情報の更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報の更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報を削除する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnEntry(koudenEntryId: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		const { error } = await supabase
			.from("return_entry_records")
			.delete()
			.eq("kouden_entry_id", koudenEntryId);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("返礼情報の削除エラー:", error);
		throw error;
	}
}

/**
 * 返礼情報のステータスを更新する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {ReturnStatus} status - 新しいステータス
 * @param {string} koudenId - 香典帳ID（キャッシュ再検証用）
 * @returns {Promise<ReturnEntryRecord>} 更新された返礼情報
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnEntryStatus(
	koudenEntryId: string,
	status: ReturnStatus,
	koudenId: string,
): Promise<ReturnEntryRecord> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		const { data, error } = await supabase
			.from("return_entry_records")
			.update({ return_status: status })
			.eq("kouden_entry_id", koudenEntryId)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new Error("返礼情報のステータス更新に失敗しました");
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);

		return data as ReturnEntryRecord;
	} catch (error) {
		console.error("返礼情報のステータス更新エラー:", error);
		throw error;
	}
}

/**
 * 複数の返礼記録を一括削除する
 * @param {string[]} returnRecordIds - 削除する返礼記録のID配列
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは削除失敗時のエラー
 */
export async function deleteReturnRecords(returnRecordIds: string[]): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		if (!returnRecordIds.length) {
			throw new Error("削除対象のIDが指定されていません");
		}

		// 削除前に関連する香典帳IDを取得（キャッシュ再検証用）
		const { data: koudenIds } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.in("id", returnRecordIds);

		// 一括削除実行
		const { error } = await supabase
			.from("return_entry_records")
			.delete()
			.in("id", returnRecordIds);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (koudenIds) {
			const uniqueKoudenIds = [...new Set(koudenIds.map((item) => item.kouden_entries.kouden_id))];
			for (const koudenId of uniqueKoudenIds) {
				revalidatePath(`/koudens/${koudenId}`);
			}
		}
	} catch (error) {
		console.error("返礼記録の一括削除エラー:", error);
		throw error;
	}
}

/**
 * 返礼記録の特定フィールドを更新する
 * @param {string} returnRecordId - 返礼記録ID
 * @param {string} fieldName - 更新するフィールド名
 * @param {ReturnRecordFieldValue} value - 新しい値
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordField(
	returnRecordId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 更新可能なフィールドのホワイトリスト
		const allowedFields = [
			"return_status",
			"funeral_gift_amount",
			"additional_return_amount",
			"return_method",
			"arrangement_date",
			"remarks",
			"shipping_postal_code",
			"shipping_address",
			"shipping_phone_number",
			"return_items_cost",
		];

		if (!allowedFields.includes(fieldName)) {
			throw new Error(`フィールド '${fieldName}' は更新できません`);
		}

		// 更新前に香典帳IDを取得（キャッシュ再検証用）
		const { data: recordData } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("id", returnRecordId)
			.single();

		// フィールド更新実行
		const updateData: Record<string, ReturnRecordFieldValue> = {
			[fieldName]: value,
			updated_at: new Date().toISOString(),
		};

		const { error } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.eq("id", returnRecordId);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (recordData) {
			revalidatePath(`/koudens/${recordData.kouden_entries.kouden_id}`);
		}
	} catch (error) {
		console.error("返礼記録フィールドの更新エラー:", error);
		throw error;
	}
}

/**
 * 香典エントリーIDベースで返礼記録の特定フィールドを更新する
 * @param {string} koudenEntryId - 香典エントリーID
 * @param {string} fieldName - 更新するフィールド名
 * @param {ReturnRecordFieldValue} value - 新しい値
 * @returns {Promise<void>}
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function updateReturnRecordFieldByKoudenEntryId(
	koudenEntryId: string,
	fieldName: string,
	value: ReturnRecordFieldValue,
): Promise<void> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 更新可能なフィールドのホワイトリスト
		const allowedFields = [
			"return_status",
			"funeral_gift_amount",
			"additional_return_amount",
			"return_method",
			"arrangement_date",
			"remarks",
			"shipping_postal_code",
			"shipping_address",
			"shipping_phone_number",
			"return_items_cost",
		];

		if (!allowedFields.includes(fieldName)) {
			throw new Error(`フィールド '${fieldName}' は更新できません`);
		}

		// 更新前に香典帳IDを取得（キャッシュ再検証用）
		const { data: recordData } = await supabase
			.from("return_entry_records")
			.select(`
				kouden_entries!inner (
					kouden_id
				)
			`)
			.eq("kouden_entry_id", koudenEntryId)
			.single();

		// フィールド更新実行
		const updateData: Record<string, ReturnRecordFieldValue> = {
			[fieldName]: value,
			updated_at: new Date().toISOString(),
		};

		const { error } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.eq("kouden_entry_id", koudenEntryId);

		if (error) {
			throw error;
		}

		// 関連する香典帳のキャッシュを再検証
		if (recordData) {
			revalidatePath(`/koudens/${recordData.kouden_entries.kouden_id}`);
		}
	} catch (error) {
		console.error("返礼記録フィールドの更新エラー:", error);
		throw error;
	}
}

/**
 * 返礼記録の一括更新
 * @param {string} koudenId - 香典帳ID
 * @param {BulkUpdateConfig} config - 一括更新設定
 * @returns {Promise<number>} 更新された件数
 * @throws {Error} 認証エラーまたは更新失敗時のエラー
 */
export async function bulkUpdateReturnRecords(
	koudenId: string,
	config: BulkUpdateConfig,
): Promise<number> {
	try {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証されていません");
		}

		// 対象レコードを取得するためのクエリを構築
		let query = supabase
			.from("return_entry_records")
			.select(`
				id,
				kouden_entry_id,
				kouden_entries!inner (
					id,
					amount,
					has_offering,
					relationship_id,
					attendance_type
				)
			`)
			.eq("kouden_entries.kouden_id", koudenId);

		// フィルター条件を適用
		const { filters } = config;

		// 金額範囲フィルター
		if (filters.amountRange) {
			if (filters.amountRange.min !== undefined) {
				query = query.gte("kouden_entries.amount", filters.amountRange.min);
			}
			if (filters.amountRange.max !== undefined) {
				query = query.lte("kouden_entries.amount", filters.amountRange.max);
			}
		}

		// 関係性フィルター
		if (filters.relationshipIds && filters.relationshipIds.length > 0) {
			query = query.in("kouden_entries.relationship_id", filters.relationshipIds);
		}

		// 現在のステータスフィルター
		if (filters.currentStatuses && filters.currentStatuses.length > 0) {
			query = query.in("return_status", filters.currentStatuses);
		}

		// 参列タイプフィルター
		if (filters.attendanceTypes && filters.attendanceTypes.length > 0) {
			query = query.in("kouden_entries.attendance_type", filters.attendanceTypes);
		}

		// お供物の有無フィルター
		if (filters.hasOffering !== undefined) {
			query = query.eq("kouden_entries.has_offering", filters.hasOffering);
		}

		// 対象レコードを取得
		const { data: targetRecords, error: selectError } = await query;

		if (selectError) {
			throw selectError;
		}

		if (!targetRecords || targetRecords.length === 0) {
			return 0;
		}

		// 更新データを構築
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};

		const { updates } = config;

		if (updates.status) {
			updateData.return_status = updates.status;
		}

		if (updates.returnMethod) {
			updateData.return_method = updates.returnMethod;
		}

		if (updates.arrangementDate) {
			updateData.arrangement_date = updates.arrangementDate.toISOString();
		}

		if (updates.remarks) {
			updateData.remarks = updates.remarks;
		}

		// 返礼品の操作
		if (updates.returnItems) {
			// TODO: 返礼品の操作ロジックを実装
			// 現在は基本的なステータス・方法の更新のみ対応
			console.log("返礼品の操作:", updates.returnItems);
		}

		// 一括更新実行
		const targetIds = targetRecords.map((record) => record.id);
		const { error: updateError } = await supabase
			.from("return_entry_records")
			.update(updateData)
			.in("id", targetIds);

		if (updateError) {
			throw updateError;
		}

		// キャッシュを再検証
		revalidatePath(`/koudens/${koudenId}`);

		return targetRecords.length;
	} catch (error) {
		console.error("返礼記録の一括更新エラー:", error);
		throw error;
	}
}
