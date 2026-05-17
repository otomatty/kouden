"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type KoudenEntryRow = Database["public"]["Tables"]["kouden_entries"]["Row"];

export async function subscribeToKoudenEntries(
	koudenId: string,
): Promise<ActionResult<KoudenEntryRow[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data: entries, error } = await supabase
			.from("kouden_entries")
			.select("*, offerings (*), return_items (*)")
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return (entries as KoudenEntryRow[]) ?? [];
	}, "香典エントリーの取得");
}

export async function getRealtimeToken(): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}
		return null;
	}, "リアルタイムトークン取得");
}
