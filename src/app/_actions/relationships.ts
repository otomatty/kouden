"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

// すべての関係性を取得
export async function getAllRelationships() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("relationships")
		.select(`
			*,
			kouden:koudens(
				id,
				title
			)
		`)
		.order("is_default", { ascending: false })
		.order("name");

	if (error) throw error;
	return data;
}

// 香典帳の関係性を取得
export async function getRelationships(koudenId: string) {
	const supabase = await createClient();

	try {
		// 1. まず関係性の存在確認
		const { count, error: countError } = await supabase
			.from("relationships")
			.select("*", { count: "exact", head: true })
			.eq("kouden_id", koudenId);

		if (countError) {
			console.error("[ERROR] Failed to count relationships:", countError);
			throw countError;
		}

		// 関係性が存在しない場合はすぐに空配列を返す
		if (count === 0) {
			console.warn(`[WARN] No relationships found for kouden ${koudenId}`);
			return [];
		}

		// 2. 関係性データの取得（必要な列のみ）
		const { data, error } = await supabase
			.from("relationships")
			.select(`
				id,
				name,
				description,
				is_default,
				is_enabled,
				kouden_id,
				created_at,
				updated_at,
				created_by
			`)
			.eq("kouden_id", koudenId)
			.order("is_default", { ascending: false })
			.order("name");

		if (error) {
			console.error("[ERROR] Failed to fetch relationships:", error);
			throw error;
		}

		if (!data || data.length === 0) {
			console.warn(`[WARN] No relationships data returned for kouden ${koudenId}`);
			return [];
		}

		return data;
	} catch (error) {
		console.error("[ERROR] Error in getRelationships:", error);
		throw error;
	}
}

/**
 * 管理者用: 香典帳の関係性を取得
 */
export async function getRelationshipsForAdmin(koudenId: string) {
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
		// 1. まず関係性の存在確認
		const { count, error: countError } = await supabase
			.from("relationships")
			.select("*", { count: "exact", head: true })
			.eq("kouden_id", koudenId);

		if (countError) {
			console.error("[ERROR] Failed to count relationships for admin:", countError);
			throw countError;
		}

		// 関係性が存在しない場合はすぐに空配列を返す
		if (count === 0) {
			console.warn(`[WARN] No relationships found for kouden ${koudenId}`);
			return [];
		}

		// 2. 関係性データの取得（必要な列のみ）
		const { data, error } = await supabase
			.from("relationships")
			.select(`
				id,
				name,
				description,
				is_default,
				is_enabled,
				kouden_id,
				created_at,
				updated_at,
				created_by
			`)
			.eq("kouden_id", koudenId)
			.order("is_default", { ascending: false })
			.order("name");

		if (error) {
			console.error("[ERROR] Failed to fetch relationships for admin:", error);
			throw error;
		}

		if (!data || data.length === 0) {
			console.warn(`[WARN] No relationships data returned for kouden ${koudenId}`);
			return [];
		}

		return data;
	} catch (error) {
		console.error("[ERROR] Error in getRelationshipsForAdmin:", error);
		throw error;
	}
}

// 香典帳に新しい関係性を追加
export async function createRelationship(input: {
	koudenId: string;
	name: string;
	description?: string;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase
		.from("relationships")
		.insert({
			kouden_id: input.koudenId,
			name: input.name,
			description: input.description,
			is_default: false,
			created_by: user.id,
		})
		.select()
		.single();

	if (error) throw error;
	revalidatePath(`/koudens/${input.koudenId}`);
	return data;
}

// 関係性を更新
export async function updateRelationship(
	id: string,
	input: { name?: string; description?: string; is_default?: boolean },
) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("relationships")
		.update({
			...input,
		})
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	revalidatePath(`/koudens/${data.kouden_id}`);
	return data;
}

// 関係性を削除
export async function deleteRelationship(id: string) {
	const supabase = await createClient();
	const { data: relationship } = await supabase
		.from("relationships")
		.select("kouden_id")
		.eq("id", id)
		.single();

	const { error } = await supabase.from("relationships").delete().eq("id", id);

	if (error) throw error;
	if (relationship) {
		revalidatePath(`/koudens/${relationship.kouden_id}`);
	}
}

// 香典帳作成時にデフォルトの関係性を初期化
// TODO: デフォルトの関係性作成はfunctionsの方で実装していた気がするので確認する
export async function initializeDefaultRelationships(koudenId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new Error("Not authenticated");

		const defaultRelationships = [
			{ name: "仕事関係", description: "職場や仕事上の関係者" },
			{ name: "友人", description: "友人・知人" },
			{ name: "親族", description: "親族・家族" },
		];

		const { error } = await supabase
			.from("relationships")
			.insert(
				defaultRelationships.map((rel) => ({
					kouden_id: koudenId,
					name: rel.name,
					description: rel.description,
					is_default: true,
					created_by: user.id,
				})),
			)
			.select();

		if (error) throw error;
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("[ERROR] Error initializing default relationships:", error);
		throw new Error("デフォルトの関係性の初期化に失敗しました");
	}
}
