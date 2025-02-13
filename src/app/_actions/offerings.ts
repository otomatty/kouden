"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	Offering,
	CreateOfferingInput,
	UpdateOfferingInput,
	CreateOfferingPhotoInput,
	UpdateOfferingPhotoInput,
	OfferingWithKoudenEntries,
} from "@/types/offerings";
import { snakeToCamel } from "@/utils/case-converter";
import type { Database } from "@/types/supabase";

//お供物情報を作成する
export async function createOffering(input: Omit<CreateOfferingInput, "created_by">) {
	try {
		// デバッグ: 入力データの確認
		console.log("[DEBUG] createOffering input:", input);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("[ERROR] Authentication required");
			throw new Error("認証が必要です");
		}

		// デバッグ: 認証ユーザー情報
		console.log("[DEBUG] Authenticated user:", { id: user.id });

		const { kouden_entry_ids, photos, ...offeringData } = input;

		// データベースに挿入するデータ
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

		if (error) {
			console.error("お供え物の作成に失敗しました:", error);
			throw new Error("お供え物の作成に失敗しました。");
		}

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

			if (offeringEntriesError) {
				console.error("香典エントリーの関連付けに失敗しました:", offeringEntriesError);
				throw new Error("香典エントリーの関連付けに失敗しました。");
			}
		}

		// 香典の更新日時を更新
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", input.kouden_id as string);

		if (updateError) {
			console.error("[ERROR] Failed to update kouden:", {
				error: updateError,
				code: updateError.code,
				details: updateError.details,
				hint: updateError.hint,
				message: updateError.message,
			});
			// 更新エラーは致命的ではないのでログのみ
		}

		revalidatePath(`/koudens/${input.kouden_id}`);
		return data;
	} catch (error) {
		console.error("お供え物の作成処理中にエラーが発生しました:", error);
		throw error;
	}
}

// お供物情報を更新する
export async function updateOffering(id: string, input: UpdateOfferingInput) {
	const supabase = await createClient();

	try {
		// 認証済みのユーザーを取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("ユーザーが見つかりませんでした。");
		}

		// データベースを更新
		const { data, error } = await supabase
			.from("offerings")
			.update(input)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("お供え物の更新に失敗しました:", error);
			throw new Error("お供え物の更新に失敗しました。");
		}

		// 香典の更新日時を更新
		const { error: updateError } = await supabase
			.from("koudens")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", input.kouden_id as string);

		if (updateError) {
			console.error("[ERROR] Failed to update kouden:", {
				error: updateError,
				code: updateError.code,
				details: updateError.details,
				hint: updateError.hint,
				message: updateError.message,
			});
			// 更新エラーは致命的ではないのでログのみ
		}

		revalidatePath(`/koudens/${input.kouden_id}`);
		return data;
	} catch (error) {
		console.error("お供え物の更新処理中にエラーが発生しました:", error);
		throw error;
	}
}

// お供物情報を削除する
export async function deleteOffering(id: string, koudenId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("offerings").delete().eq("id", id);

	if (error) {
		console.error("[deleteOffering] Delete failed:", error);
		throw new Error(`お供え物の削除に失敗しました: ${error.message}`);
	}

	// 香典の更新日時を更新
	const { error: updateError } = await supabase
		.from("koudens")
		.update({ updated_at: new Date().toISOString() })
		.eq("id", koudenId);

	if (updateError) {
		console.error("[deleteOffering] Failed to update kouden:", updateError);
		// 更新エラーは致命的ではないのでログのみ
	}

	revalidatePath(`/koudens/${koudenId}`);
}

// お供物情報を取得する
export async function getOfferings(koudenId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
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

	if (error) {
		throw new Error("お供え物の取得に失敗しました");
	}

	// データをキャメルケースに変換
	const convertedData =
		data?.map((item) => {
			const converted = snakeToCamel(item as Record<string, unknown>);
			return converted as unknown as OfferingWithKoudenEntries;
		}) || [];

	return convertedData;
}

// 写真関連の機能
export async function addOfferingPhoto(
	input: Omit<CreateOfferingPhotoInput, "created_by"> & { photos?: File[] },
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
		.eq("id", input.offering_id)
		.single();

	if (!offering) {
		throw new Error("お供え物が見つかりません");
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
				throw new Error("写真の登録に失敗しました");
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

	if (error) {
		throw new Error("写真の登録に失敗しました");
	}

	revalidatePath(`/koudens/${offering.kouden_id}`);
	return data;
}

export async function updateOfferingPhoto(id: string, input: UpdateOfferingPhotoInput) {
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

export async function deleteOfferingPhoto(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("offering_photos").delete().eq("id", id);

	if (error) {
		throw new Error("写真の削除に失敗しました");
	}
}

// お供物の特定のフィールドを更新する
export async function updateOfferingField(
	id: string,
	field: keyof Omit<Offering, "offering_entries">,
	value: string | number | boolean | null,
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("offerings")
		.update({ [field]: value })
		.eq("id", id)
		.select()
		.single();

	if (error) {
		console.error("[updateOfferingField] Update failed:", error);
		throw new Error(`お供え物の更新に失敗しました: ${error.message}`);
	}

	return data;
}
