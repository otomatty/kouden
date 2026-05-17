import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl) {
		throw new Error("Missing Supabase environment variables");
	}

	if (!supabasePublishableKey) {
		throw new Error("Missing Supabase environment variables");
	}

	return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
