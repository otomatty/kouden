import { createClient } from "@/lib/supabase/client";

export function useSupabase() {
	const supabase = createClient();
	return { supabase };
}
