"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateReturnItemInput } from "@/types/return-item";

export async function createReturnItem(input: CreateReturnItemInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data: entry } = await supabase
		.from("kouden_entries")
		.select("kouden_id")
		.eq("id", input.kouden_entry_id)
		.single();

	if (!entry) {
		throw new Error("香典情報が見つかりません");
	}

	const { data, error } = await supabase
		.from("return_items")
		.insert({
			...input,
			created_by: user.id,
			delivery_method: input.delivery_method || "MAIL",
		})
		.select()
		.single();

	if (error) {
		throw new Error("香典返しの登録に失敗しました");
	}

	// 香典返し済みフラグを更新
	await supabase
		.from("kouden_entries")
		.update({ is_return_completed: true })
		.eq("id", input.kouden_entry_id);

	revalidatePath(`/koudens/${entry.kouden_id}`);
	return data;
}

export async function getReturnItems(koudenEntryId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("return_items")
		.select("*")
		.eq("kouden_entry_id", koudenEntryId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("香典返しの取得に失敗しました");
	}

	return data;
}

export async function updateReturnItem(
	id: string,
	input: Partial<CreateReturnItemInput>,
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	if (!input.kouden_entry_id) {
		throw new Error("香典情報IDが必要です");
	}

	const { data: entry } = await supabase
		.from("kouden_entries")
		.select("kouden_id")
		.eq("id", input.kouden_entry_id)
		.single();

	if (!entry) {
		throw new Error("香典情報が見つかりません");
	}

	const { data, error } = await supabase
		.from("return_items")
		.update(input)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("香典返しの更新に失敗しました");
	}

	revalidatePath(`/koudens/${entry.kouden_id}`);
	return data;
}

export async function deleteReturnItem(id: string, koudenEntryId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data: entry } = await supabase
		.from("kouden_entries")
		.select("kouden_id")
		.eq("id", koudenEntryId)
		.single();

	if (!entry) {
		throw new Error("香典情報が見つかりません");
	}

	const { error } = await supabase.from("return_items").delete().eq("id", id);

	if (error) {
		throw new Error("香典返しの削除に失敗しました");
	}

	// 他に香典返しがない場合はフラグを更新
	const { data: remainingReturnItems } = await supabase
		.from("return_items")
		.select("id")
		.eq("kouden_entry_id", koudenEntryId);

	if (!remainingReturnItems?.length) {
		await supabase
			.from("kouden_entries")
			.update({ is_return_completed: false })
			.eq("id", koudenEntryId);
	}

	revalidatePath(`/koudens/${entry.kouden_id}`);
}
