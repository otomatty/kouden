"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
	CreateOfferingInput,
	UpdateOfferingInput,
	CreateOfferingPhotoInput,
	UpdateOfferingPhotoInput,
} from "@/types/offering";

//お供物情報を作成する
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

	// 1. お供物を作成
	const insertData = {
		...input,
		description,
		created_by: user.id,
	};
	console.log("[DEBUG] Inserting offering with data:", insertData);

	const { data: offering, error: offeringError } = await supabase
		.from("offerings")
		.insert(insertData)
		.select()
		.single();

	if (offeringError) {
		console.error("[ERROR] Failed to insert offering:", {
			error: offeringError,
			code: offeringError.code,
			details: offeringError.details,
			hint: offeringError.hint,
			message: offeringError.message,
			insertData,
			stack: offeringError.stack,
			isColumnNotExist: offeringError.code === "42703",
		});

		if (offeringError.code === "42703") {
			throw new Error(
				`データベースの列が見つかりません: ${offeringError.message}`,
			);
		}
		throw new Error(`お供え物の登録に失敗しました: ${offeringError.message}`);
	}

	if (!offering) {
		throw new Error("お供え物の登録に失敗しました");
	}

	// 香典の更新日時を更新
	const { error: updateError } = await supabase
		.from("koudens")
		.update({ updated_at: new Date().toISOString() })
		.eq("id", input.kouden_id);

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

	console.log("[DEBUG] Successfully inserted offering:", offering);

	// 2. 香典エントリーとの関連付け
	if (input.kouden_entry_ids && input.kouden_entry_ids.length > 0) {
		const offeringEntries = input.kouden_entry_ids.map((entryId) => ({
			offering_id: offering.id,
			kouden_entry_id: entryId,
			created_by: user.id,
		}));

		console.log("[DEBUG] Inserting offering entries:", offeringEntries);

		// 関連する香典エントリーの存在確認
		const { data: existingEntries, error: checkError } = await supabase
			.from("kouden_entries")
			.select("id")
			.in("id", input.kouden_entry_ids);

		if (checkError) {
			console.error("[ERROR] Failed to check existing entries:", {
				error: checkError,
				code: checkError.code,
				details: checkError.details,
				hint: checkError.hint,
				message: checkError.message,
			});
			throw new Error(
				`香典エントリーの確認に失敗しました: ${checkError.message}`,
			);
		}

		if (
			!existingEntries ||
			existingEntries.length !== input.kouden_entry_ids.length
		) {
			console.error("[ERROR] Some kouden entries not found:", {
				requested: input.kouden_entry_ids,
				found: existingEntries?.map((e) => e.id),
			});
			throw new Error("指定された香典エントリーの一部が見つかりません");
		}

		const { error: entryError } = await supabase
			.from("offering_entries")
			.insert(offeringEntries);

		if (entryError) {
			console.error("[ERROR] Failed to insert offering entries:", {
				error: entryError,
				code: entryError.code,
				details: entryError.details,
				hint: entryError.hint,
				message: entryError.message,
				entries: offeringEntries,
			});

			// エラーが発生した場合は作成したofferingを削除
			console.log("[DEBUG] Rolling back offering creation...");
			const { error: deleteError } = await supabase
				.from("offerings")
				.delete()
				.eq("id", offering.id);

			if (deleteError) {
				console.error("[ERROR] Failed to delete offering during rollback:", {
					error: deleteError,
					code: deleteError.code,
					details: deleteError.details,
					hint: deleteError.hint,
					message: deleteError.message,
				});
			}
			throw new Error(`お供え物の登録に失敗しました: ${entryError.message}`);
		}

		// has_offering フラグはトリガーで自動的に更新されるため、手動更新は不要
	} else {
		console.log("[DEBUG] No kouden entries to link");
	}

	// 3. 写真の登録（もし存在すれば）
	if (input.photos && input.photos.length > 0) {
		const offeringPhotos = input.photos.map((photo) => ({
			offering_id: offering.id,
			storage_key: photo.storage_key,
			caption: photo.caption || null,
			created_by: user.id,
		}));

		console.log("[DEBUG] Inserting offering photos:", offeringPhotos);

		const { error: photoError } = await supabase
			.from("offering_photos")
			.insert(offeringPhotos);

		if (photoError) {
			console.error("[ERROR] Failed to insert offering photos:", {
				error: photoError,
				code: photoError.code,
				details: photoError.details,
				hint: photoError.hint,
				message: photoError.message,
			});

			// エラーが発生した場合は作成したofferingを削除
			console.log("[DEBUG] Rolling back offering creation...");
			const { error: deleteError } = await supabase
				.from("offerings")
				.delete()
				.eq("id", offering.id);

			if (deleteError) {
				console.error("[ERROR] Failed to delete offering during rollback:", {
					error: deleteError,
					code: deleteError.code,
					details: deleteError.details,
					hint: deleteError.hint,
					message: deleteError.message,
				});
			}
			throw new Error(`写真の登録に失敗しました: ${photoError.message}`);
		}
	}

	console.log("[DEBUG] Successfully completed createOffering");
	revalidatePath(`/koudens/${input.kouden_id}`);
	return offering;
}

// お供物情報を更新する
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

	// 香典の更新日時を更新
	const { error: updateError } = await supabase
		.from("koudens")
		.update({ updated_at: new Date().toISOString() })
		.eq("id", offering.kouden_id);

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

	revalidatePath(`/koudens/${offering.kouden_id}`);
	return data;
}

// お供物情報を削除する
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

	// お供え物を削除（中間テーブルのエントリーは CASCADE で自動的に削除される）
	const { error } = await supabase.from("offerings").delete().eq("id", id);

	if (error) {
		throw new Error("お供え物の削除に失敗しました");
	}

	// 香典の更新日時を更新
	const { error: updateError } = await supabase
		.from("koudens")
		.update({ updated_at: new Date().toISOString() })
		.eq("id", offering.kouden_id);

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

	revalidatePath(`/koudens/${offering.kouden_id}`);
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
				kouden_entry: kouden_entries (*)
			)
		`)
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("お供え物の取得に失敗しました");
	}

	return data || [];
}

// 写真関連の機能
export async function addOfferingPhoto(input: CreateOfferingPhotoInput) {
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

	const { data, error } = await supabase
		.from("offering_photos")
		.insert({
			offering_id: input.offering_id,
			storage_key: input.storage_key,
			caption: input.caption,
			created_by: user.id,
		})
		.select()
		.single();

	if (error) {
		throw new Error("写真の登録に失敗しました");
	}

	revalidatePath(`/koudens/${offering.kouden_id}`);
	return data;
}

export async function updateOfferingPhoto(
	id: string,
	input: UpdateOfferingPhotoInput,
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
