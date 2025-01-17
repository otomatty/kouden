declare namespace NodeJS {
	interface ProcessEnv {
		NEXT_PUBLIC_SUPABASE_URL: string;
		NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		GOOGLE_REFRESH_TOKEN: string;
		GOOGLE_REDIRECT_URI: string;
		APP_URL: string;
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
	}
}
