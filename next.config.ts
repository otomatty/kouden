import type { NextConfig } from "next";
import withPWA from "next-pwa";

// CSP の対象となる Supabase オリジン。
// `NEXT_PUBLIC_SUPABASE_URL` が未設定のビルド時 (例: Storybook の型生成) でも
// 値が消えないよう、本番で利用しているプロジェクトURLをフォールバックに置く。
const supabaseOrigin =
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://tcqnsslsaizqwjuyvoyu.supabase.co";

// Content-Security-Policy のディレクティブ定義。
// まずは Report-Only で配信し、`/api/csp-report` でレポートを収集する。
const cspDirectives: Record<string, string[]> = {
	"default-src": ["'self'"],
	"script-src": ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": [
		"'self'",
		"data:",
		"blob:",
		supabaseOrigin,
		"https://*.gyazo.com",
		"https://*.imgur.com",
	],
	"font-src": ["'self'", "data:"],
	"connect-src": ["'self'", supabaseOrigin, "https://api.stripe.com"],
	"frame-src": ["https://js.stripe.com", "https://hooks.stripe.com"],
	"frame-ancestors": ["'none'"],
	"form-action": ["'self'"],
	"base-uri": ["'self'"],
	"object-src": ["'none'"],
	"report-uri": ["/api/csp-report"],
};

const contentSecurityPolicy = Object.entries(cspDirectives)
	.map(([directive, values]) => `${directive} ${values.join(" ")}`)
	.join("; ");

const config: NextConfig = withPWA({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
})({
	output: "standalone",
	images: {
		domains: [
			"tcqnsslsaizqwjuyvoyu.supabase.co",
			// スクリーンショットサービス
			"gyazo.com",
			"i.gyazo.com",
			"imgur.com",
			"i.imgur.com",
			// その他の一般的な画像ホスティング
			"github.com",
			"raw.githubusercontent.com",
		],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.gyazo.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "**.imgur.com",
				port: "",
				pathname: "/**",
			},
		],
		formats: ["image/webp", "image/avif"], // 次世代画像フォーマット対応
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		unoptimized: true, // Cloudflare Pages用の設定
	},
	// 本番環境での最適化設定
	compress: true,
	poweredByHeader: false,
	reactStrictMode: true,

	// セキュリティヘッダーの設定
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Permitted-Cross-Domain-Policies",
						value: "none",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
					{
						key: "Content-Security-Policy-Report-Only",
						value: contentSecurityPolicy,
					},
				],
			},
		];
	},
});

export default config;
