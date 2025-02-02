"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CellValue } from "@/types/table";
import type {
	Telegram,
	TelegramRow,
	CreateTelegramInput,
	UpdateTelegramInput,
} from "@/types/telegram";
import { toCamelCase, toSnakeCase } from "@/store/telegrams";
import type { EntryResponse, AttendanceType } from "@/types/entries";

// 弔電の取得（単一）
export async function getTelegram(id: string) {
	const supabase = await createClient();

	const { data, error } = await supabase.from("telegrams").select().eq("id", id).single();

	if (error) {
		throw new Error("弔電の取得に失敗しました");
	}

	return data;
}

/**
 * 弔電一覧を取得
 */
export async function getTelegrams(koudenId: string): Promise<Telegram[]> {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("telegrams")
			.select("*")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return (data as TelegramRow[]).map(toCamelCase);
	} catch (error) {
		console.error("Failed to fetch telegrams:", error);
		throw new Error("弔電の取得に失敗しました");
	}
}

/**
 * 弔電を作成
 */
export async function createTelegram(
	input: CreateTelegramInput & { koudenId: string },
): Promise<Telegram> {
	try {
		const supabase = await createClient();
		const { data: session } = await supabase.auth.getSession();
		if (!session?.session?.user?.id) throw new Error("認証が必要です");

		const snakeCaseData = toSnakeCase(input);
		const { data, error } = await supabase
			.from("telegrams")
			.insert({
				kouden_id: input.koudenId,
				sender_name: input.senderName,
				created_by: session.session.user.id,
				...snakeCaseData,
			})
			.select("*")
			.single();

		if (error) throw error;
		revalidatePath("/koudens/[id]", "page");
		return toCamelCase(data as TelegramRow);
	} catch (error) {
		console.error("Failed to create telegram:", error);
		throw new Error("弔電の作成に失敗しました");
	}
}

/**
 * 弔電を更新
 */
export async function updateTelegram(id: string, input: UpdateTelegramInput): Promise<Telegram> {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("telegrams")
			.update(toSnakeCase(input))
			.eq("id", id)
			.select("*")
			.single();

		if (error) throw error;
		revalidatePath("/koudens/[id]", "page");
		return toCamelCase(data as TelegramRow);
	} catch (error) {
		console.error("Failed to update telegram:", error);
		throw new Error("弔電の更新に失敗しました");
	}
}

/**
 * 弔電を削除
 */
export async function deleteTelegram(id: string, koudenId: string): Promise<void> {
	try {
		const supabase = await createClient();
		const { error } = await supabase.from("telegrams").delete().eq("id", id);

		if (error) throw error;
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("Failed to delete telegram:", error);
		throw new Error("弔電の削除に失敗しました");
	}
}

/**
 * 複数の弔電を削除
 */
export async function deleteTelegrams(ids: string[], koudenId: string): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("認証が必要です");

	const { error } = await supabase.from("telegrams").delete().in("id", ids);

	if (error) {
		throw new Error("弔電の一括削除に失敗しました");
	}

	Promise.resolve().then(() => {
		revalidatePath(`/koudens/${koudenId}`, "page");
	});
}

// セル単位の更新用に最適化した関数
export async function updateTelegramField(
	id: string,
	field: keyof Telegram,
	value: CellValue,
): Promise<Telegram> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	try {
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

		if (error) {
			console.error("[ERROR] Database update failed:", {
				error,
				code: error.code,
				details: error.details,
				hint: error.hint,
				message: error.message,
			});
			throw new Error(`${field}の更新に失敗しました`);
		}

		if (!updatedData) {
			console.error("[ERROR] No data returned after update");
			throw new Error(`${field}の更新に失敗しました`);
		}

		const camelCaseResult = toCamelCase(updatedData as TelegramRow);

		Promise.resolve().then(() => {
			revalidatePath(`/koudens/${updatedData.kouden_id}`);
		});

		return camelCaseResult;
	} catch (error) {
		console.error("[ERROR] Failed to update telegram field:", {
			error,
			id,
			field,
			value,
		});
		throw new Error(`${field}の更新に失敗しました`);
	}
}
