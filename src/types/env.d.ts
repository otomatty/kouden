declare namespace NodeJS {
	interface ProcessEnv {
		// アプリケーション
		NEXT_PUBLIC_APP_URL: string;
		NEXT_PUBLIC_APP_VERSION: string;
		APP_URL: string;

		// Supabase
		NEXT_PUBLIC_SUPABASE_URL: string;
		NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
		SUPABASE_SERVICE_ROLE_KEY: string;

		// Google OAuth / API
		GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		GOOGLE_REFRESH_TOKEN: string;
		GOOGLE_REDIRECT_URI: string;
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;

		// Google Calendar (サービスアカウント)
		GOOGLE_CALENDAR_ID: string;
		GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
		GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: string;

		// Stripe
		STRIPE_SECRET_KEY: string;
		STRIPE_PUBLISHABLE_KEY?: string;
		STRIPE_WEBHOOK_SECRET: string;
		STRIPE_API_VERSION?: string;

		// Resend (メール送信)
		RESEND_API_KEY: string;
		RESEND_FROM_EMAIL?: string;

		// セキュリティ
		CSRF_SECRET: string;
		CSRF_DEBUG?: string;
		CRON_SECRET: string;
		FORCE_2FA?: string;
		ADMIN_BASIC_USERNAME?: string;
		ADMIN_BASIC_PASSWORD?: string;
		ALLOWED_ADMIN_IPS?: string;
		ADMIN_SESSION_TIMEOUT?: string;
		MAX_LOGIN_ATTEMPTS?: string;
		ACCOUNT_LOCK_DURATION?: string;
		MAX_FILE_SIZE?: string;

		// 通知 / ロギング
		SLACK_WEBHOOK_URL?: string;
		LOG_LEVEL?: "debug" | "info" | "warn" | "error";
		SECURITY_LOG_LEVEL?: "debug" | "info" | "warn" | "error";
	}
}
