"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

// 香典帳の関係性を取得
export async function getRelationships(koudenId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("relationships")
		.select("*")
		.eq("kouden_id", koudenId)
		.order("is_default", { ascending: false })
		.order("name");

	if (error) throw error;
	return data;
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
	input: { name: string; description?: string },
) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("relationships")
		.update({
			name: input.name,
			description: input.description,
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
export async function initializeDefaultRelationships(koudenId: string) {
	try {
		console.log("[DEBUG] デフォルト関係性の初期化開始:", { koudenId });
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		console.log("[DEBUG] ユーザー情報:", user);
		if (!user) throw new Error("Not authenticated");

		const defaultRelationships = [
			{ name: "仕事関係", description: "職場や仕事上の関係者" },
			{ name: "友人", description: "友人・知人" },
			{ name: "親族", description: "親族・家族" },
		];

		console.log("[DEBUG] デフォルト関係性の設定:", defaultRelationships);

		const { data, error } = await supabase
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

		console.log("[DEBUG] 関係性の挿入結果:", { data, error });

		if (error) throw error;
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("[ERROR] デフォルト関係性の初期化エラー:", error);
		throw error;
	}
}
