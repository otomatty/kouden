"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/types/supabase";
import type { CreateOfferingInput, UpdateOfferingInput } from "@/types/actions";

export type OfferingResponse = Database["public"]["Tables"]["offerings"]["Row"];
export type OfferingEntryResponse =
	Database["public"]["Tables"]["offering_entries"]["Row"];
export type OfferingPhotoResponse =
	Database["public"]["Tables"]["offering_photos"]["Row"];

const offeringSchema = z.object({
	type: z.enum(["FLOWER", "FOOD", "OTHER"]),
	description: z.string().nullish(),
	quantity: z.number().min(1, "数量を入力してください").default(1),
	price: z.number().optional(),
	provider_name: z.string().min(1, "提供者名を入力してください"),
	notes: z.string().nullish(),
});

export async function createOffering(input: CreateOfferingInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// 空文字列をnullに変換
	const description = input.description === "" ? null : input.description;

	// トランザクション的な処理を実現するため、エラー時は全ての処理を巻き戻す
	const { data: offering, error: offeringError } = await supabase
		.from("offerings")
		.insert({
			kouden_id: input.kouden_id,
			type: input.type,
			description: description,
			quantity: input.quantity,
			price: input.price,
			provider_name: input.provider_name,
			notes: input.notes,
			created_by: user.id,
		})
		.select()
		.single();

	if (offeringError) {
		throw new Error("お供え物の登録に失敗しました");
	}

	if (!offering) {
		throw new Error("お供え物の登録に失敗しました");
	}

	// 中間テーブルにエントリーを作成
	const offeringEntries = input.kouden_entry_ids.map((entryId) => ({
		offering_id: offering.id,
		kouden_entry_id: entryId,
		created_by: user.id,
	}));

	const { error: entryError } = await supabase
		.from("offering_entries")
		.insert(offeringEntries);

	if (entryError) {
		// エラーが発生した場合は作成したofferingを削除
		const { error: deleteError } = await supabase
			.from("offerings")
			.delete()
			.eq("id", offering.id);

		if (deleteError) {
		}
		throw new Error("お供え物の登録に失敗しました");
	}

	// お供え物フラグを更新
	const { error: updateError } = await supabase
		.from("kouden_entries")
		.update({ has_offering: true })
		.in("id", input.kouden_entry_ids);

	if (updateError) {
		throw new Error("香典の更新に失敗しました");
	}

	revalidatePath(`/koudens/${input.kouden_id}`);
	return offering;
}

// 写真関連の機能を追加
export async function addOfferingPhoto(
	offeringId: string,
	storageKey: string,
	caption?: string,
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data: offering } = await supabase
		.from("offerings")
		.select("kouden_id")
		.eq("id", offeringId)
		.single();

	if (!offering) {
		throw new Error("お供え物が見つかりません");
	}

	const { data: photo, error } = await supabase
		.from("offering_photos")
		.insert({
			offering_id: offeringId,
			storage_key: storageKey,
			caption,
			created_by: user.id,
		})
		.select()
		.single();

	if (error) {
		throw new Error("写真の登録に失敗しました");
	}

	return photo;
}

export async function deleteOfferingPhoto(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase
		.from("offering_photos")
		.delete()
		.eq("id", id);

	if (error) {
		throw new Error("写真の削除に失敗しました");
	}
}

export async function updateOfferingPhoto(
	id: string,
	input: { caption?: string },
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("offering_photos")
		.update(input)
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("写真の更新に失敗しました");
	}

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
		.from("offering_entries")
		.select(`
			offering:offerings (
				*,
				offering_photos (*)
			)
		`)
		.eq("kouden_entry_id", koudenEntryId)
		.order("created_at", { ascending: false });

	// データが存在しない場合は空配列を返す
	if (!data || data.length === 0) {
		return [];
	}

	if (error) {
		throw new Error("お供え物の取得に失敗しました");
	}

	return data?.map((entry) => entry.offering) ?? [];
}

export async function updateOffering(id: string, input: UpdateOfferingInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// お供物情報を取得
	const { data: offering } = await supabase
		.from("offerings")
		.select("kouden_id")
		.eq("id", id)
		.single();

	if (!offering) {
		throw new Error("お供え物が見つかりません");
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

	revalidatePath(`/koudens/${offering.kouden_id}`);
	return data;
}

export async function deleteOffering(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// お供物情報を取得
	const { data: offering } = await supabase
		.from("offerings")
		.select("kouden_id")
		.eq("id", id)
		.single();

	if (!offering) {
		throw new Error("お供え物が見つかりません");
	}

	// 関連する香典情報IDを取得
	const { data: entry } = await supabase
		.from("offering_entries")
		.select("kouden_entry_id")
		.eq("offering_id", id)
		.single();

	if (!entry) {
		throw new Error("お供え物が見つかりません");
	}

	// お供え物を削除（中間テーブルのエントリーは CASCADE で自動的に削除される）
	const { error } = await supabase.from("offerings").delete().eq("id", id);

	if (error) {
		throw new Error("お供え物の削除に失敗しました");
	}

	// 他にお供え物がない場合はフラグを更新
	const { data: remainingOfferings } = await supabase
		.from("offering_entries")
		.select("id")
		.eq("kouden_entry_id", entry.kouden_entry_id);

	if (!remainingOfferings?.length) {
		await supabase
			.from("kouden_entries")
			.update({ has_offering: false })
			.eq("id", entry.kouden_entry_id);
	}

	revalidatePath(`/koudens/${offering.kouden_id}`);
}
