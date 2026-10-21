#!/usr/bin/env bun

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 統合ドキュメント管理CLI
 *
 * このスクリプトは changelog-manager.js と milestone-manager.js を
 * 統合的に管理するためのヘルパーです。
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = __dirname;

function showHelp() {
	console.log(`
📚 統合ドキュメント管理CLI

使用方法:
  bun scripts/docs-manager.js changelog <command> [args]   更新履歴を管理
  bun scripts/docs-manager.js milestone <command> [args]   マイルストーンを管理
  bun scripts/docs-manager.js help                         このヘルプを表示

更新履歴の管理:
  changelog create <version>           新しい更新履歴テンプレートを作成
  changelog generate [version] [from] Gitコミットから更新履歴を生成（Gemini AI使用）
  changelog generate-simple <version> [from] 従来の方法で更新履歴を生成
  changelog template                   テンプレートを表示

マイルストーンの管理:
  milestone create <period>            テンプレートマイルストーンを作成
  milestone interactive                インタラクティブモードでマイルストーンを作成
  milestone template                   テンプレートを表示

例:
  bun scripts/docs-manager.js changelog create 1.2.3
  bun scripts/docs-manager.js changelog generate          # package.jsonのバージョンを使用
  bun scripts/docs-manager.js changelog generate 1.2.3
  bun scripts/docs-manager.js milestone create 2025-q1
  bun scripts/docs-manager.js milestone interactive

💡 個別のスクリプトを直接実行することも可能です:
  bun scripts/changelog-manager.js create 1.2.3
  bun scripts/milestone-manager.js interactive
`);
}

function runChangelogManager(args) {
	const changelogScript = path.join(SCRIPTS_DIR, "changelog-manager.js");
	const command = `bun "${changelogScript}" ${args.join(" ")}`;

	try {
		execSync(command, { stdio: "inherit" });
	} catch {
		console.error("❌ 更新履歴管理スクリプトの実行中にエラーが発生しました");
		process.exit(1);
	}
}

function runMilestoneManager(args) {
	const milestoneScript = path.join(SCRIPTS_DIR, "milestone-manager.js");
	const command = `bun "${milestoneScript}" ${args.join(" ")}`;

	try {
		execSync(command, { stdio: "inherit" });
	} catch {
		console.error("❌ マイルストーン管理スクリプトの実行中にエラーが発生しました");
		process.exit(1);
	}
}

function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		showHelp();
		return;
	}

	const command = args[0];
	const subArgs = args.slice(1);

	switch (command) {
		case "changelog":
			if (subArgs.length === 0) {
				console.error("❌ changelogのサブコマンドを指定してください");
				showHelp();
				process.exit(1);
			}
			runChangelogManager(subArgs);
			break;

		case "milestone":
			if (subArgs.length === 0) {
				console.error("❌ milestoneのサブコマンドを指定してください");
				showHelp();
				process.exit(1);
			}
			runMilestoneManager(subArgs);
			break;

		case "help":
		case "--help":
		case "-h":
			showHelp();
			break;

		default:
			console.error(`❌ 不明なコマンド: ${command}`);
			showHelp();
			process.exit(1);
	}
}

// ES Moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { runChangelogManager, runMilestoneManager, showHelp };
