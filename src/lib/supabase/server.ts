import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createClient() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Missing Supabase environment variables");
	}

	return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return Array.from(cookieStore.getAll()).map(({ name, value }) => ({
					name,
					value,
				}));
			},
			setAll(cookies) {
				for (const { name, value, ...options } of cookies) {
					cookieStore.set({ name, value, ...options });
				}
			},
		},
	});
}

// グローバルインスタンスは作成しない
// export const supabase = createClient();
