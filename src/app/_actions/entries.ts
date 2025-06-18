"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CellValue } from "@/types/data-table/table";
import type {
	CreateEntryInput,
	EntryResponse,
	UpdateEntryInput,
	Entry,
	AttendanceType,
} from "@/types/entries";

export async function createEntry(input: CreateEntryInput): Promise<EntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
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
			// デバッグ: エラーの詳細情報をログ
			console.error("[ERROR] Create Entry with Return Record Failed:", {
				error,
				errorCode: error.code,
				errorMessage: error.message,
				errorDetails: error.details,
				input,
				userId: user.id,
			});

			// エラーメッセージの改善
			if (error.code === "42501") {
				throw new Error("香典帳へのアクセス権限がありません");
			}
			throw new Error("香典情報の作成に失敗しました");
		}

		if (!data || data.length === 0) {
			throw new Error("香典情報の作成に失敗しました");
		}

		const entryData = data[0];
		if (!entryData) {
			throw new Error("香典情報の作成に失敗しました");
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${input.koudenId}`);
		});

		// スネークケースからキャメルケースへの変換
		const response: EntryResponse = {
			...entryData, // 元のスネークケースデータを使用
			attendanceType: entryData.attendance_type as AttendanceType,
			relationshipId: entryData.relationship_id,
		};

		return response;
	} catch (error) {
		console.error("[ERROR] Unexpected error in createEntry:", {
			error,
			input,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			userId: user.id,
		});
		throw error instanceof Error ? error : new Error("香典情報の作成に失敗しました");
	}
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
): Promise<{ entries: Entry[]; count: number }> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
		// エントリー情報の取得
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		// Build base query and apply optional user filter
		let query = supabase
			.from("kouden_entries")
			.select("*", { count: "exact" })
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
			const search = `%${searchValue}%`;
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
		// Apply sorting
		if (sortValue && sortValue !== "default") {
			const [field = "created_at", direction = "desc"] = sortValue.split("_");
			const ascending = direction === "asc";
			query = query.order(field, { ascending });
		} else {
			// Default sorting by created_at desc
			query = query.order("created_at", { ascending: false });
		}
		const { data: rawEntries, count, error: entriesError } = await query.range(from, to);
		const entries = rawEntries ?? [];

		if (entriesError) {
			console.error("[ERROR] Failed to fetch entries:", {
				message: entriesError.message,
				details: entriesError.details,
				hint: entriesError.hint,
				code: entriesError.code,
			});
			throw new Error("香典情報の取得に失敗しました");
		}

		// 関係性情報の取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name, description")
			.eq("kouden_id", koudenId);

		if (relationshipsError) {
			console.error("[ERROR] Failed to fetch relationships:", {
				message: relationshipsError.message,
				details: relationshipsError.details,
				hint: relationshipsError.hint,
				code: relationshipsError.code,
			});
			throw new Error("関係性情報の取得に失敗しました");
		}

		// 関係性情報をエントリーにマッピング
		const entriesWithRelationships = entries.map((entry) => ({
			...entry,
			attendanceType: entry.attendance_type as AttendanceType,
			relationshipId: entry.relationship_id,
			relationship: relationships.find((r) => r.id === entry.relationship_id) || null,
		}));

		return { entries: entriesWithRelationships as Entry[], count: count ?? 0 };
	} catch (error) {
		console.error("[ERROR] Unexpected error in getEntries:", error);
		throw error;
	}
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
): Promise<{ entries: Entry[]; count: number }> {
	// 管理者権限をチェック
	const { isAdmin } = await import("@/app/_actions/admin/permissions");
	const adminCheck = await isAdmin();
	if (!adminCheck) {
		throw new Error("管理者権限が必要です");
	}

	// 管理者用クライアント（RLSバイパス）を使用
	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	try {
		// エントリー情報の取得
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		// Build base query and apply optional user filter
		let query = supabase
			.from("kouden_entries")
			.select("*", { count: "exact" })
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
			const search = `%${searchValue}%`;
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
		// Apply sorting
		if (sortValue && sortValue !== "default") {
			const [field = "created_at", direction = "desc"] = sortValue.split("_");
			const ascending = direction === "asc";
			query = query.order(field, { ascending });
		} else {
			// Default sorting by created_at desc
			query = query.order("created_at", { ascending: false });
		}
		const { data: rawEntries, count, error: entriesError } = await query.range(from, to);
		const entries = rawEntries ?? [];

		if (entriesError) {
			console.error("[ERROR] Failed to fetch entries for admin:", {
				message: entriesError.message,
				details: entriesError.details,
				hint: entriesError.hint,
				code: entriesError.code,
			});
			throw new Error("香典情報の取得に失敗しました");
		}

		// 関係性情報の取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name, description")
			.eq("kouden_id", koudenId);

		if (relationshipsError) {
			console.error("[ERROR] Failed to fetch relationships for admin:", {
				message: relationshipsError.message,
				details: relationshipsError.details,
				hint: relationshipsError.hint,
				code: relationshipsError.code,
			});
			throw new Error("関係性情報の取得に失敗しました");
		}

		// 関係性情報をエントリーにマッピング
		const entriesWithRelationships = entries.map((entry) => ({
			...entry,
			attendanceType: entry.attendance_type as AttendanceType,
			relationshipId: entry.relationship_id,
			relationship: relationships.find((r) => r.id === entry.relationship_id) || null,
		}));

		return { entries: entriesWithRelationships as Entry[], count: count ?? 0 };
	} catch (error) {
		console.error("[ERROR] Unexpected error in getEntriesForAdmin:", error);
		throw error;
	}
}

export async function getEntry(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase.from("kouden_entries").select("*").eq("id", id).single();
	if (error) {
		throw new Error("香典情報の取得に失敗しました");
	}

	return data;
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<EntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
		// フロントエンドのキーをデータベースのカラム名に変換
		const {
			id: _id,
			koudenId,
			attendanceType,
			hasOffering,
			isReturnCompleted,
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
			is_return_completed: isReturnCompleted,
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

		if (error || !updatedData) {
			console.error("[ERROR] Update failed:", {
				error,
				id,
			});
			throw new Error("香典情報の更新に失敗しました");
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData.kouden_id}`);
		});

		return {
			...updatedData,
			attendanceType: updatedData.attendance_type as AttendanceType,
			relationshipId: updatedData.relationship_id,
		};
	} catch (error) {
		console.error("[ERROR] Failed to update entry:", error);
		throw new Error("香典情報の更新に失敗しました");
	}
}

export async function deleteEntry(id: string, koudenId: string): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("kouden_entries").delete().eq("id", id);

	if (error) {
		throw new Error("香典情報の削除に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${koudenId}`);
	});
}

// 複数エントリーの一括削除機能
export async function deleteEntries(ids: string[], koudenId: string): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("kouden_entries").delete().in("id", ids);

	if (error) {
		throw new Error("香典情報の一括削除に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${koudenId}`);
	});
}

// セル単位の更新用に最適化した関数
export async function updateEntryField(
	id: string,
	field: keyof EntryResponse,
	value: CellValue,
): Promise<EntryResponse> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
		// フロントエンドのキーをデータベースのカラム名に変換
		const dbFieldMap: Record<string, string> = {
			postalCode: "postal_code",
			phoneNumber: "phone_number",
			relationshipId: "relationship_id",
			hasOffering: "has_offering",
			isReturnCompleted: "is_return_completed",
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

		if (error || !updatedData) {
			throw new Error(`${field}の更新に失敗しました`);
		}

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData.kouden_id}`);
		});

		return {
			...updatedData,
			attendanceType: updatedData.attendance_type as AttendanceType,
			relationshipId: updatedData.relationship_id,
		};
	} catch (error) {
		console.error("[ERROR] Failed to update entry:", error);
		throw new Error(`${field}の更新に失敗しました`);
	}
}
