"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const offeringSchema = z.object({
	kouden_entry_id: z.string().uuid(),
	type: z.enum(["FLOWER", "FOOD", "OTHER"]),
	description: z.string().min(1, "内容を入力してください"),
	price: z.number().optional(),
	notes: z.string().optional(),
});

export type CreateOfferingInput = z.infer<typeof offeringSchema>;

export async function createOffering(input: CreateOfferingInput) {
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
		.from("offerings")
		.insert({
			...input,
			created_by: user.id,
		})
		.select()
		.single();

	if (error) {
		throw new Error("お供え物の登録に失敗しました");
	}

	// お供え物フラグを更新
	await supabase
		.from("kouden_entries")
		.update({ has_offering: true })
		.eq("id", input.kouden_entry_id);

	revalidatePath(`/koudens/${entry.kouden_id}`);
	return data;
}

export async function getOfferings(koudenEntryId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("offerings")
		.select("*")
		.eq("kouden_entry_id", koudenEntryId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("お供え物の取得に失敗しました");
	}

	return data;
}

export async function updateOffering(
	id: string,
	input: Partial<CreateOfferingInput>,
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
		.from("offerings")
		.update(input)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("お供え物の更新に失敗しました");
	}

	revalidatePath(`/koudens/${entry.kouden_id}`);
	return data;
}

export async function deleteOffering(id: string, koudenEntryId: string) {
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

	const { error } = await supabase.from("offerings").delete().eq("id", id);

	if (error) {
		throw new Error("お供え物の削除に失敗しました");
	}

	// 他にお供え物がない場合はフラグを更新
	const { data: remainingOfferings } = await supabase
		.from("offerings")
		.select("id")
		.eq("kouden_entry_id", koudenEntryId);

	if (!remainingOfferings?.length) {
		await supabase
			.from("kouden_entries")
			.update({ has_offering: false })
			.eq("id", koudenEntryId);
	}

	revalidatePath(`/koudens/${entry.kouden_id}`);
}
