#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

/**
 * OSS版用のpackage.jsonを準備する
 */
function prepareOSSPackage() {
	console.log("🔄 Preparing OSS package.json...");

	const packageJsonPath = path.join(__dirname, "../../package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

	// プレミアム/商用機能の依存関係を削除
	const premiumDependencies = [
		"@google/generative-ai", // AI機能
		"stripe", // 決済機能
		"firebase-admin", // Firebase Admin（エンタープライズ）
		"speakeasy", // 2FA機能
		"@supabase/realtime-js", // 高度なリアルタイム機能
		"qrcode", // QRコード生成（プレミアム）
		"nodemailer", // メール送信（商用）
	];

	// 依存関係から削除
	for (const dep of premiumDependencies) {
		if (packageJson.dependencies && packageJson.dependencies[dep]) {
			delete packageJson.dependencies[dep];
			console.log(`❌ Removed premium dependency: ${dep}`);
		}
		if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
			delete packageJson.devDependencies[dep];
			console.log(`❌ Removed premium devDependency: ${dep}`);
		}
	});

	// OSS版用の設定に変更
	packageJson.name = "kouden-oss";
	packageJson.description =
		"Open source funeral guest book management app - 香典帳管理アプリ（オープンソース版）";
	packageJson.homepage = "https://github.com/otomatty/kouden-oss";
	packageJson.repository = {
		type: "git",
		url: "https://github.com/otomatty/kouden-oss.git",
	};
	packageJson.bugs = {
		url: "https://github.com/otomatty/kouden-oss/issues",
	};

	// プライベート設定を削除
	delete packageJson.private;

	// スクリプトをOSS版用に調整
	const ossScripts = {
		dev: "next dev -p 3000",
		build: "next build",
		start: "next start -p 3000",
		lint: "biome check",
		"lint:fix": "biome check --apply",
		test: "vitest",
		"test:ui": "vitest --ui",
		storybook: "storybook dev -p 6006",
		"build-storybook": "storybook build",
	};

	packageJson.scripts = ossScripts;

	// OSS版用の環境変数設定を追加
	packageJson.engines = {
		node: ">=18.0.0",
		bun: ">=1.0.0",
	};

	// キーワードを追加
	packageJson.keywords = [
		"funeral",
		"guest-book",
		"kouden",
		"japanese",
		"nextjs",
		"react",
		"typescript",
		"opensource",
	];

	// 出力先ディレクトリを作成
	const outputDir = path.join(__dirname, "../../oss-temp");
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// OSS版package.jsonを出力
	const outputPath = path.join(outputDir, "package.json");
	fs.writeFileSync(outputPath, JSON.stringify(packageJson, null, 2));

	console.log("✅ OSS package.json prepared successfully");
	console.log(`📦 Dependencies count: ${Object.keys(packageJson.dependencies || {}).length}`);
	console.log(`🛠️ DevDependencies count: ${Object.keys(packageJson.devDependencies || {}).length}`);
}

// 環境変数ファイルの準備
function prepareEnvExample() {
	console.log("🔄 Preparing .env.example...");

	const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags (OSS Version)
ENABLE_PREMIUM_FEATURES=false
ENABLE_AI_FEATURES=false
ENABLE_ANALYTICS=false
ENABLE_MULTI_ORG=false

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
`;

	const outputPath = path.join(__dirname, "../../oss-temp/.env.example");
	fs.writeFileSync(outputPath, envExample);

	console.log("✅ .env.example prepared successfully");
}

// Docker設定の準備
function prepareDockerfile() {
	console.log("🔄 Preparing Dockerfile...");

	const dockerfile = `FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

	const outputPath = path.join(__dirname, "../../oss-temp/Dockerfile");
	fs.writeFileSync(outputPath, dockerfile);

	console.log("✅ Dockerfile prepared successfully");
}

// メイン処理
function main() {
	try {
		console.log("🚀 Starting OSS package preparation...");

		prepareOSSPackage();
		prepareEnvExample();
		prepareDockerfile();

		console.log("✨ OSS package preparation completed successfully!");
	} catch (error) {
		console.error("❌ Error preparing OSS package:", error);
		process.exit(1);
	}
}

// スクリプトが直接実行された場合
if (require.main === module) {
	main();
}

module.exports = {
	prepareOSSPackage,
	prepareEnvExample,
	prepareDockerfile,
};
