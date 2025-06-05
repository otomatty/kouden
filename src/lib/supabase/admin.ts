import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Service Role キーでSupabaseクライアントを生成し、RLSをバイパスします
 */
export function createAdminClient() {
	const url = supabaseUrl;
	const key = supabaseServiceRoleKey;
	if (!url) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
	}
	if (!key) {
		throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
	}
	return createClient<Database>(url, key);
}
