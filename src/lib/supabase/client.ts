import type { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl) {
		throw new Error("Missing Supabase environment variables");
	}

	if (!supabaseAnonKey) {
		throw new Error("Missing Supabase environment variables");
	}

	return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
