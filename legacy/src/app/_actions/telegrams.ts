"use server";

import { cacheTags } from "@/lib/cache-tags";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { toCamelCase, toSnakeCase } from "@/store/telegrams";
import type { CellValue } from "@/types/data-table/table";
import type {
	CreateTelegramInput,
	Telegram,
	TelegramRow,
	UpdateTelegramInput,
} from "@/types/telegrams";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Invalidate caches affected by a telegram mutation.
 *
 * Revalidates the kouden subtree via `layout` mode and emits the `telegrams`
 * cache tag for any future `unstable_cache` consumers.
 *
 * @param koudenId - Target kouden ID whose caches should be invalidated.
 */
function revalidateTelegramsCaches(koudenId: string) {
	revalidatePath(`/koudens/${koudenId}`, "layout");
	revalidateTag(cacheTags.telegrams(koudenId));
}

// 弔電の取得（単一）
export async function getTelegram(id: string): Promise<ActionResult<TelegramRow>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const { data, error } = await supabase.from("telegrams").select().eq("id", id).single();

		if (error) throw error;
		return data;
	}, "弔電の取得");
}

/**
 * 弔電一覧を取得
 */
export async function getTelegrams(koudenId: string): Promise<ActionResult<Telegram[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("telegrams")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return (data as TelegramRow[]).map(toCamelCase);
	}, "弔電一覧の取得");
}

/**
 * 弔電を作成
 */
export async function createTelegram(
	input: CreateTelegramInput & { koudenId: string },
): Promise<ActionResult<Telegram>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);

		const snakeCaseData = toSnakeCase(input);
		const { data, error } = await supabase
			.from("telegrams")
			.insert({
				kouden_id: input.koudenId,
				sender_name: input.senderName,
				created_by: user.id,
				...snakeCaseData,
			})
			.select("*")
			.single();

		if (error) throw error;
		revalidateTelegramsCaches(input.koudenId);
		return toCamelCase(data as TelegramRow);
	}, "弔電の作成");
}

/**
 * 弔電を更新
 */
export async function updateTelegram(
	id: string,
	input: UpdateTelegramInput,
): Promise<ActionResult<Telegram>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("telegrams")
			.update(toSnakeCase(input))
			.eq("id", id)
			.select("*")
			.single();

		if (error) throw error;
		revalidateTelegramsCaches(data.kouden_id);
		return toCamelCase(data as TelegramRow);
	}, "弔電の更新");
}

/**
 * 弔電を削除
 */
export async function deleteTelegram(id: string, koudenId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { error } = await supabase.from("telegrams").delete().eq("id", id);

		if (error) throw error;
		revalidateTelegramsCaches(koudenId);
		return null;
	}, "弔電の削除");
}

/**
 * 複数の弔電を削除
 */
export async function deleteTelegrams(
	ids: string[],
	koudenId: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);

		const { error } = await supabase.from("telegrams").delete().in("id", ids);

		if (error) throw error;

		revalidateTelegramsCaches(koudenId);
		return null;
	}, "弔電の一括削除");
}

// セル単位の更新用に最適化した関数
export async function updateTelegramField(
	id: string,
	field: keyof Telegram,
	value: CellValue,
): Promise<ActionResult<Telegram>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// フィールド名をスネークケースに変換
		const fieldObject = { [field]: value };
		const snakeCaseObject = toSnakeCase(fieldObject);
		const snakeCaseField = Object.keys(snakeCaseObject)[0];

		// データベース更新前の状態確認
		const updatePayload = {
			[snakeCaseField as string]: value === "" ? null : value,
		};

		const { error, data: updatedData } = await supabase
			.from("telegrams")
			.update(updatePayload)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		if (!updatedData) {
			throw new KoudenError(`${String(field)}の更新に失敗しました`, ErrorCodes.DB_UPDATE_ERROR);
		}

		const camelCaseResult = toCamelCase(updatedData as TelegramRow);

		revalidateTelegramsCaches(updatedData.kouden_id);

		return camelCaseResult;
	}, "弔電フィールドの更新");
}
