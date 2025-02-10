"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export async function subscribeToKoudenEntries(koudenId: string) {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error("認証が必要です");
	}

	const { data: entries } = await supabase
		.from("kouden_entries")
		.select("*, offerings (*), return_items (*)")
		.eq("kouden_id", koudenId)
		.order("created_at", { ascending: false });

	return entries || [];
}

export async function getRealtimeToken() {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error("認証が必要です");
	}
}
