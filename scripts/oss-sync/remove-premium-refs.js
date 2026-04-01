#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

/**
 * プレミアム機能への参照をコードから削除する
 */
class PremiumRefRemover {
	constructor(sourceDir) {
		this.sourceDir = sourceDir;
		this.processedFiles = 0;
		this.modifiedFiles = 0;
	}

	/**
	 * ディレクトリを再帰的に処理
	 */
	processDirectory(dir) {
		if (!fs.existsSync(dir)) {
			console.log(`⚠️  Directory not found: ${dir}`);
			return;
		}

		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				// サブディレクトリを再帰処理
				this.processDirectory(filePath);
			} else if (this.shouldProcessFile(file)) {
				this.processFile(filePath);
			}
		}
	}

	/**
	 * ファイルを処理すべきかチェック
	 */
	shouldProcessFile(filename) {
		const extensions = [".tsx", ".ts", ".jsx", ".js", ".json"];
		return extensions.some((ext) => filename.endsWith(ext));
	}

	/**
	 * 個別ファイルを処理
	 */
	processFile(filePath) {
		this.processedFiles++;

		try {
			let content = fs.readFileSync(filePath, "utf8");
			const originalContent = content;

			// プレミアム機能の参照を削除
			content = this.removePremiumImports(content);
			content = this.removePremiumBlocks(content);
			content = this.disablePremiumFeatures(content);
			content = this.removeStripeReferences(content);
			content = this.removeAIReferences(content);
			content = this.removeFirebaseReferences(content);

			// JSONファイルの特別処理
			if (filePath.endsWith(".json")) {
				content = this.processJsonFile(content, filePath);
			}

			// 変更があった場合のみファイルを更新
			if (content !== originalContent) {
				fs.writeFileSync(filePath, content);
				this.modifiedFiles++;
				console.log(`✏️  Modified: ${path.relative(this.sourceDir, filePath)}`);
			}
		} catch (_error) {}
	}

	/**
	 * プレミアム機能のimport文を削除
	 */
	removePremiumImports(content) {
		const premiumImportPatterns = [
			/import.*from.*['"].*\/premium\/.*['"];?\n/g,
			/import.*from.*['"].*\/saas\/.*['"];?\n/g,
			/import.*from.*['"].*\/enterprise\/.*['"];?\n/g,
			/import.*from.*['"].*stripe.*['"];?\n/g,
			/import.*from.*['"].*@google\/generative-ai.*['"];?\n/g,
			/import.*from.*['"].*firebase-admin.*['"];?\n/g,
			/import.*from.*['"].*speakeasy.*['"];?\n/g,
			/import.*from.*['"].*nodemailer.*['"];?\n/g,
		];

		return premiumImportPatterns.reduce((result, pattern) => result.replace(pattern, ""), content);
	}

	/**
	 * プレミアム機能のコードブロックを削除
	 */
	removePremiumBlocks(content) {
		const patterns = [
			/\/\* PREMIUM_START \*\/[\s\S]*?\/\* PREMIUM_END \*\//g,
			/\/\/ PREMIUM_START[\s\S]*?\/\/ PREMIUM_END/g,
			/<!-- PREMIUM_START -->[\s\S]*?<!-- PREMIUM_END -->/g,
		];

		return patterns.reduce((result, pattern) => result.replace(pattern, ""), content);
	}

	/**
	 * 環境変数でプレミアム機能を無効化
	 */
	disablePremiumFeatures(content) {
		const replacements = [
			{
				from: /process\.env\.ENABLE_PREMIUM_FEATURES/g,
				to: "false",
			},
			{
				from: /process\.env\.ENABLE_AI_FEATURES/g,
				to: "false",
			},
			{
				from: /process\.env\.ENABLE_ANALYTICS/g,
				to: "false",
			},
			{
				from: /process\.env\.ENABLE_MULTI_ORG/g,
				to: "false",
			},
			{
				from: /process\.env\.ENABLE_ENTERPRISE/g,
				to: "false",
			},
		];

		return replacements.reduce((result, { from, to }) => result.replace(from, to), content);
	}

	/**
	 * Stripe関連の参照を削除
	 */
	removeStripeReferences(content) {
		const stripePatterns = [
			/import.*Stripe.*from.*['"]stripe['"];?\n/g,
			/const stripe = new Stripe\(.*\);?\n/g,
			/stripe\.[a-zA-Z]+\(.*\)/g,
			/process\.env\.STRIPE_[A-Z_]+/g,
		];

		return stripePatterns.reduce(
			(result, pattern) =>
				result.replace(pattern, "/* Stripe functionality removed in OSS version */"),
			content,
		);
	}

	/**
	 * AI機能の参照を削除
	 */
	removeAIReferences(content) {
		const aiPatterns = [
			/from.*['"]@google\/generative-ai['"];?\n/g,
			/GoogleGenerativeAI/g,
			/genAI\.[a-zA-Z]+\(.*\)/g,
			/process\.env\.GEMINI_API_KEY/g,
		];

		return aiPatterns.reduce(
			(result, pattern) => result.replace(pattern, "/* AI functionality removed in OSS version */"),
			content,
		);
	}

	/**
	 * Firebase関連の参照を削除
	 */
	removeFirebaseReferences(content) {
		const firebasePatterns = [
			/import.*from.*['"]firebase-admin['"];?\n/g,
			/admin\.[a-zA-Z]+\(\)/g,
			/process\.env\.FIREBASE_[A-Z_]+/g,
		];

		return firebasePatterns.reduce(
			(result, pattern) => result.replace(pattern, "/* Firebase Admin removed in OSS version */"),
			content,
		);
	}

	/**
	 * JSONファイルの処理
	 */
	processJsonFile(content, filePath) {
		try {
			const jsonData = JSON.parse(content);

			// package.jsonの場合は依存関係を調整済みなのでスキップ
			if (path.basename(filePath) === "package.json") {
				return content;
			}

			// 他のJSONファイルからプレミアム関連の設定を削除
			const { premium, stripe, ai, ...cleanData } = jsonData;
			return JSON.stringify(cleanData, null, 2);
		} catch (error) {
			console.log(`⚠️  Skipping JSON processing for ${filePath}: ${error.message}`);
			return content;
		}
	}

	/**
	 * 処理結果を表示
	 */
	showSummary() {
		console.log("\n📊 Processing Summary:");
		console.log(`📁 Processed files: ${this.processedFiles}`);
		console.log(`✏️  Modified files: ${this.modifiedFiles}`);
		console.log("✅ Premium references removed successfully");
	}
}

/**
 * メイン処理
 */
function main() {
	const sourceDir = path.join(__dirname, "../../oss-temp");

	if (!fs.existsSync(sourceDir)) {
		console.log("💡 Make sure to run prepare-oss-package.js first");
		process.exit(1);
	}

	console.log("🔄 Removing premium references from OSS version...");
	console.log(`📂 Source directory: ${sourceDir}`);

	const remover = new PremiumRefRemover(sourceDir);
	remover.processDirectory(sourceDir);
	remover.showSummary();
}

// スクリプトが直接実行された場合
if (import.meta.url === new URL(import.meta.url).href) {
	main();
}

export { PremiumRefRemover };
