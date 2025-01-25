import { createClient } from "@/lib/supabase/server";
import type { Telegram } from "@/types/telegram";
import { convertToCamelCase } from "@/lib/utils";

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
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("telegrams")
		.select()
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error("弔電一覧の取得に失敗しました");
	}

	return data.map((item) => convertToCamelCase<Telegram>(item));
}
