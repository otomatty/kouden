export function getSupabaseConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!url || !publishableKey) {
		throw new Error(
			"Missing Supabase environment variables. Please check your .env file.",
		);
	}

	return {
		url,
		publishableKey,
	};
}
