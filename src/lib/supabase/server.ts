import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createClient() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
	if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

	return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return Array.from(cookieStore.getAll()).map(({ name, value }) => ({
					name,
					value,
				}));
			},
			setAll(cookies) {
				try {
					for (const { name, value, ...options } of cookies) {
						cookieStore.set({ name, value, ...options });
					}
				} catch (error) {
					console.error("Error setting cookies:", error);
					// Handle or log error if needed
				}
			},
		},
	});
}

// グローバルインスタンスは作成しない
// export const supabase = createClient();
