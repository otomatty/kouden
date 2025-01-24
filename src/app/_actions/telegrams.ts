import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Telegram } from "@/types/telegram";
import { convertToCamelCase } from "@/lib/utils";

// 弔電の作成
export async function createTelegram(input: {
	koudenId: string;
	koudenEntryId?: string;
	senderName: string;
	senderOrganization?: string;
	senderPosition?: string;
	message?: string;
	notes?: string;
}): Promise<Telegram> {
	console.log("createTelegram: Starting with input:", input);

	// 空文字列を null に変換
	const sanitizedInput = {
		...input,
		koudenId: input.koudenId,
		koudenEntryId: input.koudenEntryId || null,
		senderOrganization: input.senderOrganization || null,
		senderPosition: input.senderPosition || null,
		message: input.message || null,
		notes: input.notes || null,
	};

	console.log("createTelegram: Sanitized input:", sanitizedInput);
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証されていません");
	}

	// 香典エントリーの存在確認（指定された場合のみ）
	if (sanitizedInput.koudenEntryId) {
		console.log(
			"createTelegram: Checking kouden entry:",
			sanitizedInput.koudenEntryId,
		);
		const { data: entry, error: entryError } = await supabase
			.from("kouden_entries")
			.select("id")
			.eq("id", sanitizedInput.koudenEntryId)
			.single();

		if (entryError || !entry) {
			console.error("createTelegram: Entry check error:", entryError);
			throw new Error("指定された香典エントリーが見つかりません");
		}
	}

	console.log("createTelegram: Inserting telegram data");
	const { data, error } = await supabase
		.from("telegrams")
		.insert({
			kouden_id: sanitizedInput.koudenId,
			kouden_entry_id: sanitizedInput.koudenEntryId,
			sender_name: sanitizedInput.senderName,
			sender_organization: sanitizedInput.senderOrganization,
			sender_position: sanitizedInput.senderPosition,
			message: sanitizedInput.message,
			notes: sanitizedInput.notes,
			created_by: user.id,
		})
		.select()
		.single();

	if (error) {
		console.error("createTelegram: Insert error:", error);
		if (error.code === "23503") {
			throw new Error("指定された香典エントリーが見つかりません");
		}
		throw new Error("弔電の作成に失敗しました");
	}

	console.log("createTelegram: Successfully created telegram:", data);

	// パスの再検証
	if (sanitizedInput.koudenEntryId) {
		// 特定の香典エントリーページを再検証
		revalidatePath(`/koudens/${sanitizedInput.koudenEntryId}`);
	} else {
		// 全ての香典エントリーページを再検証
		revalidatePath("/koudens", "layout");
	}

	return convertToCamelCase(data);
}

// 弔電の取得（単一）
export async function getTelegram(id: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("telegrams")
		.select()
		.eq("id", id)
		.single();

	if (error) {
		throw new Error("弔電の取得に失敗しました");
	}

	return data;
}

// 弔電の取得（一覧）
export async function getTelegrams(koudenId: string): Promise<Telegram[]> {
	console.log("getTelegrams: Starting with koudenId:", koudenId);
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("telegrams")
		.select()
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("getTelegrams: Error fetching telegrams:", error);
		throw new Error("弔電一覧の取得に失敗しました");
	}

	console.log("getTelegrams: Retrieved data:", data);
	return data.map((item) => convertToCamelCase<Telegram>(item));
}

// 弔電の更新
export async function updateTelegram(
	id: string,
	input: {
		koudenId: string;
		senderName: string;
		senderOrganization?: string;
		senderPosition?: string;
		message?: string;
		notes?: string;
		koudenEntryId?: string;
	},
): Promise<Telegram> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("telegrams")
		.update({
			kouden_id: input.koudenId,
			kouden_entry_id: input.koudenEntryId,
			sender_name: input.senderName,
			sender_organization: input.senderOrganization,
			sender_position: input.senderPosition,
			message: input.message,
			notes: input.notes,
		})
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("弔電の更新に失敗しました");
	}

	// 関連する香典エントリーのIDを取得して、そのパスを再検証
	const koudenEntryId = data.kouden_entry_id;
	revalidatePath(`/koudens/${koudenEntryId}`);
	return convertToCamelCase(data);
}

// 弔電の削除
export async function deleteTelegram(id: string) {
	const supabase = await createClient();

	// 削除前に関連する香典エントリーのIDを取得
	const { data: telegram } = await supabase
		.from("telegrams")
		.select("kouden_entry_id")
		.eq("id", id)
		.single();

	if (!telegram) {
		throw new Error("弔電が見つかりません");
	}

	const { error } = await supabase.from("telegrams").delete().eq("id", id);

	if (error) {
		throw new Error("弔電の削除に失敗しました");
	}

	revalidatePath(`/koudens/${telegram.kouden_entry_id}`);
}
