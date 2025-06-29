import withPWA from "next-pwa";
import type { NextConfig } from "next";

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
	reactStrictMode: false, // 一時的に無効化（デバッグ用）
	// Next.js 15では不要な設定のため削除

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
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
});

export default config;
