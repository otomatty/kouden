"use server";

import { cacheTags } from "@/lib/cache-tags";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { buildOrIlikePattern, parseEntrySortValue } from "@/lib/security/search-sanitize";
import { createClient } from "@/lib/supabase/server";
import type { CellValue } from "@/types/data-table/table";
import type {
	AttendanceType,
	CreateEntryInput,
	Entry,
	EntryResponse,
	UpdateEntryInput,
} from "@/types/entries";
import type { Database } from "@/types/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidate caches affected by an entry mutation.
 *
 * Entries are surfaced on the entries page and feed into statistics and
 * return records, so we invalidate the whole kouden subtree via `layout`
 * mode and emit cache tags for any future `unstable_cache` consumers.
 */
function revalidateEntriesCaches(koudenId: string) {
	revalidatePath(`/koudens/${koudenId}`, "layout");
	revalidateTag(cacheTags.entries(koudenId));
	revalidateTag(cacheTags.statistics(koudenId));
	revalidateTag(cacheTags.returnRecords(koudenId));
}

export async function createEntry(input: CreateEntryInput): Promise<ActionResult<EntryResponse>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// トランザクションを開始して香典エントリと返礼情報を同時に作成
		const { data, error } = await supabase.rpc("create_entry_with_return_record", {
			p_kouden_id: input.koudenId,
			p_created_by: user.id,
			p_name: input.name || undefined,
			p_organization: input.organization || undefined,
			p_position: input.position || undefined,
			p_amount: input.amount,
			p_postal_code: input.postalCode || undefined,
			p_address: input.address || undefined,
			p_phone_number: input.phoneNumber || undefined,
			p_relationship_id: input.relationshipId || undefined,
			p_attendance_type: input.attendanceType,
			p_has_offering: input.hasOffering,
			p_notes: input.notes || undefined,
		});

		if (error) {
			// エラーメッセージの改善
			if (error.code === "42501") {
				throw new KoudenError("香典帳へのアクセス権限がありません", ErrorCodes.FORBIDDEN);
			}
			throw error;
		}

		if (!data || data.length === 0) {
			throw new KoudenError("香典情報の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		const entryData = data[0];
		if (!entryData) {
			throw new KoudenError("香典情報の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR);
		}

		revalidateEntriesCaches(input.koudenId);

		// スネークケースからキャメルケースへの変換
		const response: EntryResponse = {
			...entryData, // 元のスネークケースデータを使用
			attendanceType: entryData.attendance_type as AttendanceType,
			relationshipId: entryData.relationship_id,
		};

		return response;
	}, "香典情報の作成");
}

/**
 * セレクター/ルックアップ用に香典エントリーを取得する
 * - お供物・返礼ダイアログのエントリー選択や、ID→エントリーの参照を想定
 * - 関係性テーブル・return_entry_records の JOIN を行わず、追加クエリも不要
 * - ページネーションは行わないが、暴走防止のため上限件数を設ける
 */
const ENTRIES_SELECTOR_MAX = 5000;

export async function getEntriesForSelector(koudenId: string): Promise<ActionResult<Entry[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("kouden_entries")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false })
			.limit(ENTRIES_SELECTOR_MAX);

		if (error) throw error;

		const rows = data ?? [];
		return rows.map((entry) => ({
			...entry,
			attendanceType: entry.attendance_type as AttendanceType,
			relationshipId: entry.relationship_id,
		})) as Entry[];
	}, "香典情報の取得");
}

export async function getEntries(
	koudenId: string,
	page = 1,
	pageSize = 100,
	memberIds?: string[],
	searchValue?: string,
	sortValue?: string,
	dateFrom?: string,
	dateTo?: string,
	showDuplicates?: boolean,
): Promise<ActionResult<{ entries: Entry[]; count: number }>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// エントリー情報の取得
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		// Build base query with return status join
		let query = supabase
			.from("kouden_entries")
			.select(
				`
				*,
				return_entry_records:return_entry_records(return_status)
			`,
				{ count: "exact" },
			)
			.eq("kouden_id", koudenId);
		// Filter by duplicate flag if requested
		if (showDuplicates) {
			query = query.eq("is_duplicate", true);
		}
		if (memberIds && memberIds.length > 0) {
			// Filter entries by selected creator user IDs
			query = query.in("created_by", memberIds);
		}
		// Apply global search filter
		if (searchValue) {
			const search = buildOrIlikePattern(searchValue);
			query = query.or(
				`name.ilike.${search},address.ilike.${search},organization.ilike.${search},position.ilike.${search}`,
			);
		}
		// Apply date range filter
		if (dateFrom) {
			query = query.gte("created_at", dateFrom);
		}
		if (dateTo) {
			query = query.lte("created_at", dateTo);
		}
		// Apply sorting (sortValue は信頼できないユーザー入力のためホワイトリスト経由で解決)
		{
			const { field, ascending } = parseEntrySortValue(sortValue);
			query = query.order(field, { ascending });
		}
		const { data: rawEntries, count, error: entriesError } = await query.range(from, to);
		const entries = rawEntries ?? [];

		if (entriesError) throw entriesError;

		// 関係性情報の取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name, description")
			.eq("kouden_id", koudenId);

		if (relationshipsError) throw relationshipsError;

		// 関係性情報をエントリーにマッピング
		const entriesWithRelationships = entries.map((entry) => ({
			...entry,
			attendanceType: entry.attendance_type as AttendanceType,
			relationshipId: entry.relationship_id,
			relationship: relationships.find((r) => r.id === entry.relationship_id) || null,
			returnStatus: Array.isArray(entry.return_entry_records)
				? entry.return_entry_records[0]?.return_status || "PENDING"
				: (entry.return_entry_records as { return_status?: string })?.return_status || "PENDING",
		}));

		return { entries: entriesWithRelationships as Entry[], count: count ?? 0 };
	}, "香典情報の取得");
}

/**
 * 管理者用: エントリー一覧を取得
 */
export async function getEntriesForAdmin(
	koudenId: string,
	page = 1,
	pageSize = 100,
	memberIds?: string[],
	searchValue?: string,
	sortValue?: string,
	dateFrom?: string,
	dateTo?: string,
	showDuplicates?: boolean,
): Promise<ActionResult<{ entries: Entry[]; count: number }>> {
	return withActionResult(async () => {
		// 管理者権限をチェック
		const { isAdmin } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdmin();
		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 管理者用クライアント（RLSバイパス）を使用
		const { createAdminClient } = await import("@/lib/supabase/admin");
		const supabase = createAdminClient();

		// エントリー情報の取得
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		// Build base query with return status join
		let query = supabase
			.from("kouden_entries")
			.select(
				`
				*,
				return_entry_records:return_entry_records(return_status)
			`,
				{ count: "exact" },
			)
			.eq("kouden_id", koudenId);
		// Filter by duplicate flag if requested
		if (showDuplicates) {
			query = query.eq("is_duplicate", true);
		}
		if (memberIds && memberIds.length > 0) {
			// Filter entries by selected creator user IDs
			query = query.in("created_by", memberIds);
		}
		// Apply global search filter
		if (searchValue) {
			const search = buildOrIlikePattern(searchValue);
			query = query.or(
				`name.ilike.${search},address.ilike.${search},organization.ilike.${search},position.ilike.${search}`,
			);
		}
		// Apply date range filter
		if (dateFrom) {
			query = query.gte("created_at", dateFrom);
		}
		if (dateTo) {
			query = query.lte("created_at", dateTo);
		}
		// Apply sorting (sortValue は信頼できないユーザー入力のためホワイトリスト経由で解決)
		{
			const { field, ascending } = parseEntrySortValue(sortValue);
			query = query.order(field, { ascending });
		}
		const { data: rawEntries, count, error: entriesError } = await query.range(from, to);
		const entries = rawEntries ?? [];

		if (entriesError) throw entriesError;

		// 関係性情報の取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name, description")
			.eq("kouden_id", koudenId);

		if (relationshipsError) throw relationshipsError;

		// 関係性情報をエントリーにマッピング
		const entriesWithRelationships = entries.map((entry) => ({
			...entry,
			attendanceType: entry.attendance_type as AttendanceType,
			relationshipId: entry.relationship_id,
			relationship: relationships.find((r) => r.id === entry.relationship_id) || null,
			returnStatus: Array.isArray(entry.return_entry_records)
				? entry.return_entry_records[0]?.return_status || "PENDING"
				: (entry.return_entry_records as { return_status?: string })?.return_status || "PENDING",
		}));

		return { entries: entriesWithRelationships as Entry[], count: count ?? 0 };
	}, "香典情報の取得");
}

export async function getEntry(
	id: string,
): Promise<ActionResult<Database["public"]["Tables"]["kouden_entries"]["Row"]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase.from("kouden_entries").select("*").eq("id", id).single();
		if (error) throw error;

		return data;
	}, "香典情報の取得");
}

export async function updateEntry(
	id: string,
	input: UpdateEntryInput,
): Promise<ActionResult<EntryResponse>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// フロントエンドのキーをデータベースのカラム名に変換
		const {
			id: Id,
			koudenId,
			attendanceType,
			hasOffering,
			postalCode,
			phoneNumber,
			relationshipId,
			...rest
		} = input;
		const updateData = {
			...rest,
			kouden_id: koudenId,
			attendance_type: attendanceType,
			has_offering: hasOffering,
			postal_code: postalCode,
			phone_number: phoneNumber,
			relationship_id: relationshipId,
		};

		const { error, data: updatedData } = await supabase
			.from("kouden_entries")
			.update({
				...updateData,
				attendance_type:
					updateData.attendance_type === null ? undefined : updateData.attendance_type,
				relationship_id: updateData.relationship_id === "" ? undefined : updateData.relationship_id,
			})
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		if (!updatedData) {
			throw new KoudenError("香典情報の更新に失敗しました", ErrorCodes.DB_UPDATE_ERROR);
		}

		revalidateEntriesCaches(updatedData.kouden_id);

		return {
			...updatedData,
			attendanceType: updatedData.attendance_type as AttendanceType,
			relationshipId: updatedData.relationship_id,
		};
	}, "香典情報の更新");
}

export async function deleteEntry(id: string, koudenId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase.from("kouden_entries").delete().eq("id", id);

		if (error) throw error;

		revalidateEntriesCaches(koudenId);
		return null;
	}, "香典情報の削除");
}

// 複数エントリーの一括削除機能
export async function deleteEntries(ids: string[], koudenId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase.from("kouden_entries").delete().in("id", ids);

		if (error) throw error;

		revalidateEntriesCaches(koudenId);
		return null;
	}, "香典情報の一括削除");
}

// セル単位の更新用に最適化した関数
export async function updateEntryField(
	id: string,
	field: keyof EntryResponse,
	value: CellValue,
): Promise<ActionResult<EntryResponse>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// フロントエンドのキーをデータベースのカラム名に変換
		const dbFieldMap: Record<string, string> = {
			postalCode: "postal_code",
			phoneNumber: "phone_number",
			relationshipId: "relationship_id",
			hasOffering: "has_offering",
			attendanceType: "attendance_type",
		};

		const dbField = dbFieldMap[field] || field;

		const { error, data: updatedData } = await supabase
			.from("kouden_entries")
			.update({
				[dbField]: value === "" ? null : value,
			})
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		if (!updatedData) {
			throw new KoudenError(`${field}の更新に失敗しました`, ErrorCodes.DB_UPDATE_ERROR);
		}

		revalidateEntriesCaches(updatedData.kouden_id);

		return {
			...updatedData,
			attendanceType: updatedData.attendance_type as AttendanceType,
			relationshipId: updatedData.relationship_id,
		};
	}, "香典情報の更新");
}
