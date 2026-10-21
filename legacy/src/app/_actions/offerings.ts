"use server";

import { cacheTags } from "@/lib/cache-tags";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type {
	CreateOfferingInput,
	CreateOfferingPhotoInput,
	Offering,
	OfferingWithKoudenEntries,
	UpdateOfferingInput,
	UpdateOfferingPhotoInput,
} from "@/types/offerings";
import type { Database } from "@/types/supabase";
import { snakeToCamel } from "@/utils/case-converter";
import { revalidatePath, revalidateTag } from "next/cache";

type OfferingRow = Database["public"]["Tables"]["offerings"]["Row"];
type OfferingPhotoRow = Database["public"]["Tables"]["offering_photos"]["Row"];

/**
 * Invalidate caches affected by an offering mutation.
 *
 * Offerings are surfaced on the offerings page and reference kouden entries
 * (for allocation/attribution), so this revalidates the whole kouden subtree
 * via `layout` mode and emits the `offerings` and `entries` cache tags for
 * any future `unstable_cache` consumers.
 *
 * @param koudenId - Target kouden ID whose caches should be invalidated.
 */
function revalidateOfferingsCaches(koudenId: string) {
	revalidatePath(`/koudens/${koudenId}`, "layout");
	revalidateTag(cacheTags.offerings(koudenId));
	revalidateTag(cacheTags.entries(koudenId));
}

//お供物情報を作成する
export async function createOffering(
	input: Omit<CreateOfferingInput, "created_by">,
): Promise<ActionResult<OfferingRow>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { kouden_entry_ids, photos, ...offeringData } = input;

		const offeringDataToInsert: Database["public"]["Tables"]["offerings"]["Insert"] = {
			...offeringData,
			created_by: user.id,
		};

		// データベースに新しいお供え物を挿入
		const { data, error } = await supabase
			.from("offerings")
			.insert([offeringDataToInsert])
			.select()
			.single();

		if (error) throw error;

		// 関連する香典エントリーを offering_entries テーブルに挿入
		if (kouden_entry_ids && kouden_entry_ids.length > 0) {
			const offeringEntries = kouden_entry_ids.map((koudenEntryId) => ({
				offering_id: data.id,
				kouden_entry_id: koudenEntryId,
				created_by: user.id,
			}));

			const { error: offeringEntriesError } = await supabase
				.from("offering_entries")
				.insert(offeringEntries);

			if (offeringEntriesError) throw offeringEntriesError;
		}

		// 香典の更新日時を更新（更新エラーは致命的ではないのでログのみ）
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", input.kouden_id as string);

		if (updateError) {
			logger.error(
				{
					error: updateError.message,
					code: updateError.code,
					details: updateError.details,
					hint: updateError.hint,
					koudenId: input.kouden_id,
				},
				"Failed to update kouden",
			);
		}

		revalidateOfferingsCaches(input.kouden_id as string);
		return data;
	}, "お供え物の作成");
}

// お供物情報を更新する
export async function updateOffering(
	id: string,
	input: UpdateOfferingInput,
): Promise<ActionResult<OfferingRow>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		// 認証済みのユーザーを取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// kouden_entry_ids を分離してお供物データのみを更新
		const { kouden_entry_ids, ...offeringData } = input;

		// データベースを更新
		const { data, error } = await supabase
			.from("offerings")
			.update(offeringData)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		// 既存の関連付けを削除してから新しい関連付けを追加
		if (kouden_entry_ids !== undefined) {
			// 既存の関連付けを削除
			const { error: deleteError } = await supabase
				.from("offering_entries")
				.delete()
				.eq("offering_id", id);

			if (deleteError) throw deleteError;

			// 新しい関連付けを追加
			if (kouden_entry_ids.length > 0) {
				const offeringEntries = kouden_entry_ids.map((koudenEntryId) => ({
					offering_id: id,
					kouden_entry_id: koudenEntryId,
					created_by: user.id,
				}));

				const { error: insertError } = await supabase
					.from("offering_entries")
					.insert(offeringEntries);

				if (insertError) throw insertError;
			}
		}

		// 香典の更新日時を更新（更新エラーは致命的ではないのでログのみ）
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", input.kouden_id as string);

		if (updateError) {
			logger.error(
				{
					error: updateError.message,
					code: updateError.code,
					details: updateError.details,
					hint: updateError.hint,
					koudenId: input.kouden_id,
				},
				"Failed to update kouden",
			);
		}

		revalidateOfferingsCaches(input.kouden_id as string);
		return data;
	}, "お供え物の更新");
}

// お供物情報を削除する
export async function deleteOffering(id: string, koudenId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase.from("offerings").delete().eq("id", id);

		if (error) throw error;

		// 香典の更新日時を更新（更新エラーは致命的ではないのでログのみ）
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", koudenId);

		if (updateError) {
			logger.error(
				{
					error: updateError.message,
					code: updateError.code,
					koudenId,
				},
				"[deleteOffering] Failed to update kouden",
			);
		}

		revalidateOfferingsCaches(koudenId);
		return null;
	}, "お供え物の削除");
}

// お供物情報を取得する
export async function getOfferings(
	koudenId: string,
): Promise<ActionResult<OfferingWithKoudenEntries[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("offerings")
			.select(`
				*,
				offering_photos (*),
				offering_entries (
					*,
					kouden_entry: kouden_entries (
						id,
						name,
						organization,
						amount
					)
				)
			`)
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) throw error;

		// データをキャメルケースに変換
		// 注: `snakeToCamel` の戻り値型は join 後のネストした型変換まで追跡できないため、
		// `OfferingWithKoudenEntries` へ二段キャストで合わせる。実体はライブラリ側で
		// snake_case→camelCase に再構築済み。
		const convertedData =
			data?.map((item) => {
				const converted = snakeToCamel(item as Record<string, unknown>);
				return converted as unknown as OfferingWithKoudenEntries;
			}) || [];

		return convertedData;
	}, "お供え物の取得");
}

// 写真関連の機能
export async function addOfferingPhoto(
	input: Omit<CreateOfferingPhotoInput, "created_by"> & { photos?: File[] },
): Promise<ActionResult<OfferingPhotoRow[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data: offering } = await supabase
			.from("offerings")
			.select("kouden_id")
			.eq("id", input.offering_id)
			.single();

		if (!offering) {
			throw new KoudenError("お供え物が見つかりません", ErrorCodes.NOT_FOUND);
		}

		const uploadedPhotos = await Promise.all(
			input.photos?.map(async (photo) => {
				const { data, error } = await supabase.storage
					.from("offerings")
					.upload(`${user.id}/${Date.now()}-${photo.name}`, photo, {
						cacheControl: "3600",
						upsert: false,
					});

				if (error) {
					throw new KoudenError("写真の登録に失敗しました", ErrorCodes.DB_INSERT_ERROR);
				}

				return { storage_key: data.path, caption: input.caption ?? "" };
			}) || [],
		);

		// データベースに登録
		const { data, error } = await supabase
			.from("offering_photos")
			.insert(
				uploadedPhotos.map((photo) => ({
					offering_id: input.offering_id,
					storage_key: photo.storage_key,
					caption: photo.caption,
					created_by: user.id,
				})),
			)
			.select();

		if (error) throw error;

		revalidateOfferingsCaches(offering.kouden_id);
		return data ?? [];
	}, "写真の登録");
}

export async function updateOfferingPhoto(
	id: string,
	input: UpdateOfferingPhotoInput,
): Promise<ActionResult<OfferingPhotoRow>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("offering_photos")
			.update(input)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}, "写真の更新");
}

export async function deleteOfferingPhoto(id: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase.from("offering_photos").delete().eq("id", id);

		if (error) throw error;
		return null;
	}, "写真の削除");
}

// お供物の特定のフィールドを更新する
export async function updateOfferingField(
	id: string,
	field: keyof Omit<Offering, "offering_entries">,
	value: string | number | boolean | null,
): Promise<ActionResult<OfferingRow>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("offerings")
			.update({ [field]: value })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		return data;
	}, "お供え物の更新");
}
