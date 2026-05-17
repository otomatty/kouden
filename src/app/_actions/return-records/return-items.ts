"use server";

/**
 * 返礼品マスター情報に関するServer Actions
 * @module return-items
 */

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type {
	CreateReturnItemInput,
	ReturnItem,
	UpdateReturnItemInput,
} from "@/types/return-records/return-items";
import { revalidatePath } from "next/cache";

/**
 * 返礼品マスター情報作成用の入力型（香典帳IDが必要）
 */
type CreateReturnItemWithKoudenInput = CreateReturnItemInput & {
	kouden_id: string;
};

/**
 * 返礼品マスター情報を作成する
 */
export async function createReturnItem(
	input: CreateReturnItemWithKoudenInput,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// より安全なユーザー認証の取得
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		// 入力データの検証
		if (!input.name || input.price < 0) {
			throw new KoudenError("入力データが不正です", ErrorCodes.INVALID_INPUT);
		}

		// 必要なデータのみを抽出
		const returnItemData = {
			name: input.name,
			description: input.description,
			price: input.price,
			kouden_id: input.kouden_id,
			category: input.category,
			image_url: input.image_url,
			is_active: input.is_active ?? true,
			sort_order: input.sort_order ?? 1,
			recommended_amount_min: input.recommended_amount_min,
			recommended_amount_max: input.recommended_amount_max,
			created_by: user.id,
		};

		// 権限の確認
		const { data: permission, error: permissionError } = await supabase
			.from("kouden_members")
			.select(`
				kouden_roles (
					name
				)
			`)
			.eq("kouden_id", input.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (permissionError || !permission) {
			throw new KoudenError(
				"この香典帳に対する権限がありません",
				ErrorCodes.FORBIDDEN,
			);
		}

		const roleName = permission.kouden_roles?.name;
		const hasPermission = ["owner", "editor"].includes(roleName ?? "");
		if (!hasPermission) {
			throw new KoudenError("返礼品の作成権限がありません", ErrorCodes.FORBIDDEN);
		}

		const { error } = await supabase.from("return_items").insert(returnItemData);

		if (error) {
			// 一意制約違反は専用メッセージで返す（Supabase の生メッセージは UI に出さない）
			if (error.code === "23505") {
				throw new KoudenError(
					"同じ名前の返礼品が既に存在します",
					ErrorCodes.ALREADY_EXISTS,
				);
			}
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${input.kouden_id}/settings/return-items`);
		return null;
	}, "返礼品の作成");
}

/**
 * 香典帳IDに紐づく返礼品マスター情報一覧を取得する
 */
export async function getReturnItems(koudenId: string): Promise<ActionResult<ReturnItem[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("return_items")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data as ReturnItem[];
	}, "返礼品の取得");
}

/**
 * 返礼品マスター情報を取得する
 */
export async function getReturnItem(id: string): Promise<ActionResult<ReturnItem | null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const { data, error } = await supabase.from("return_items").select("*").eq("id", id).single();

		if (error) {
			throw error;
		}

		return data as ReturnItem;
	}, "返礼品マスター情報の取得");
}

/**
 * 返礼品マスター情報を更新する
 */
export async function updateReturnItem(
	input: UpdateReturnItemInput & { kouden_id: string },
): Promise<ActionResult<ReturnItem>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		const { id, kouden_id, ...updateData } = input;

		const { data, error } = await supabase
			.from("return_items")
			.update(updateData)
			.eq("id", id)
			.select("*")
			.single();

		if (error) {
			throw error;
		}

		if (!data) {
			throw new KoudenError(
				"返礼品マスター情報の更新に失敗しました",
				ErrorCodes.DB_UPDATE_ERROR,
			);
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${kouden_id}`);

		return data as ReturnItem;
	}, "返礼品マスター情報の更新");
}

/**
 * 返礼品マスター情報を削除する
 */
export async function deleteReturnItem(
	id: string,
	koudenId: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// セッションの取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証されていません", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase.from("return_items").delete().eq("id", id);

		if (error) {
			throw error;
		}

		// キャッシュの再検証
		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "返礼品情報の削除");
}

/**
 * 返礼品画像をSupabaseストレージにアップロード
 */
export async function uploadReturnItemImage(
	imageBlob: Blob,
	koudenId: string,
): Promise<ActionResult<string>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// ファイル名を生成（タイムスタンプ + UUID）
		const timestamp = Date.now();
		const randomId = crypto.randomUUID();
		const fileName = `${timestamp}_${randomId}.webp`;
		const filePath = `${koudenId}/${user.id}/${fileName}`;

		// ストレージにアップロード
		const { data, error: uploadError } = await supabase.storage
			.from("return-items")
			.upload(filePath, imageBlob, {
				cacheControl: "3600",
				upsert: false,
				contentType: "image/webp",
			});

		if (uploadError) {
			throw uploadError;
		}

		// 公開URLを取得
		const { data: publicUrl } = supabase.storage.from("return-items").getPublicUrl(data.path);

		return publicUrl.publicUrl;
	}, "画像のアップロード");
}

/**
 * 返礼品画像をSupabaseストレージから削除
 *
 * 削除エラーは致命的ではないためログのみに留め、必ず成功を返す。
 */
export async function deleteReturnItemImage(imageUrl: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		try {
			// URLからパスを抽出
			const url = new URL(imageUrl);
			const pathSegments = url.pathname.split("/");
			// パス例: /storage/v1/object/public/return-items/kouden_id/user_id/filename.webp
			const bucketIndex = pathSegments.indexOf("return-items");
			if (bucketIndex === -1) {
				throw new KoudenError("無効な画像URLです", ErrorCodes.INVALID_INPUT);
			}

			const filePath = pathSegments.slice(bucketIndex + 1).join("/");

			// ストレージから削除
			const { error } = await supabase.storage.from("return-items").remove([filePath]);

			if (error) {
				logger.error(
					{
						error: error.message,
						imageUrl,
						filePath,
					},
					"Failed to delete return item image",
				);
				// 削除エラーは致命的ではないのでログのみ
			}
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : String(error),
					imageUrl,
				},
				"Delete return item image failed",
			);
			// 削除エラーは致命的ではないのでログのみ
		}

		return null;
	}, "画像の削除");
}
