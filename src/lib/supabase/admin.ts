import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

/**
 * Secret キーでSupabaseクライアントを生成し、RLSをバイパスします
 */
export function createAdminClient() {
	const url = supabaseUrl;
	const key = supabaseSecretKey;
	if (!url) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
	}
	if (!key) {
		throw new Error("Missing SUPABASE_SECRET_KEY");
	}
	return createClient<Database>(url, key);
}
