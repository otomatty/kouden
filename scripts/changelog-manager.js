#!/usr/bin/env bun

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 更新履歴管理CLI
 *
 * 使用方法:
 * bun scripts/changelog-manager.js create <version> - 新しい更新履歴を作成
 * bun scripts/changelog-manager.js generate <version> - Gitコミットから更新履歴を生成
 * bun scripts/changelog-manager.js template - テンプレートを表示
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHANGELOG_DIR = path.join(__dirname, "../src/docs/changelogs");
const PACKAGE_JSON_PATH = path.join(__dirname, "../package.json");

// package.jsonを読み込む
function getPackageVersion() {
	try {
		const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
		return packageJson.version;
	} catch (_error) {
		process.stderr.write("Error: package.json の読み込みに失敗しました。\n");
		process.exit(1);
	}
}

// Gemini APIを使ってコミット情報から更新履歴を生成
async function generateChangelogWithGemini(commits, version) {
	// 環境変数からGemini APIキーを取得
	const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
	if (!apiKey) {
		console.log("💡 .envファイルにGOOGLE_AI_API_KEY=your_api_keyを追加してください");
		return null;
	}

	const prompt = `
以下のGitコミット履歴から、バージョン ${version} の更新履歴を生成してください。

コミット履歴:
${commits.map((commit, index) => `${index + 1}. ${commit}`).join("\n")}

以下のMDXフォーマットで出力してください：

---
title: "バージョン ${version} リリース"
description: "簡潔なリリース説明（1文）"
version: "${version}"
releaseDate: "${new Date().toISOString().split("T")[0]}"
type: "major|minor|patch"
category: "feature|bugfix|security|performance"
highlights:
  - "主要な変更点1"
  - "主要な変更点2"
  - "主要な変更点3"
breaking: false
---

# バージョン ${version} リリースノート

## 🎉 新機能

<Accordion title="新機能一覧" defaultOpen={true}>

（新機能がある場合、詳細を記述）

</Accordion>

## 🐛 バグ修正

<Accordion title="修正一覧">

（バグ修正がある場合、詳細を記述）

</Accordion>

## 🔧 改善

<Accordion title="改善一覧">

（改善がある場合、詳細を記述）

</Accordion>

---

注意点:
- type は セマンティックバージョニングに基づいて判定してください
- category は最も多い変更のタイプを選択してください
- highlights は最も重要な3つの変更点を選んでください
- セクションが空の場合は省略してください
- 日本語で出力してください
- breaking changes がある場合は breaking: true に設定してください
`;

	try {
		console.log("🤖 Gemini AIで更新履歴を生成中...");

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt,
								},
							],
						},
					],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Gemini API エラー: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!generatedText) {
			throw new Error("Gemini APIからの応答が空です");
		}

		return generatedText.trim();
	} catch (_error) {
		return null;
	}
}

// 更新履歴テンプレート
const CHANGELOG_TEMPLATE = (version, type = "minor", category = "feature") => `---
title: "バージョン ${version} リリース"
description: "新機能とバグ修正を含むアップデートです。"
version: "${version}"
releaseDate: "${new Date().toISOString().split("T")[0]}"
type: "${type}"
category: "${category}"
highlights:
  - "新機能の追加"
  - "バグ修正"
  - "パフォーマンス改善"
breaking: false
---

# バージョン ${version} リリースノート

## 🎉 新機能

### 機能名
新機能の説明をここに記述します。

<Accordion title="詳細情報" defaultOpen={true}>

- 機能の詳細1
- 機能の詳細2
- 機能の詳細3

</Accordion>

## 🐛 バグ修正

### 修正内容
修正されたバグの説明をここに記述します。

## 🔧 改善

### パフォーマンス改善
- 処理速度の向上
- メモリ使用量の最適化

## 🛠 技術的変更

### 新規依存関係
- パッケージ名: 説明

### 内部構造の変更
- ファイル構造の変更
- アーキテクチャの改善

---

このリリースにより、より使いやすく高性能なアプリケーションを提供できるようになりました。
`;

// バージョン番号の妥当性チェック
function validateVersion(version) {
	const versionRegex = /^\d+\.\d+\.\d+$/;
	if (!versionRegex.test(version)) {
		process.stderr.write(`Error: 無効なバージョン形式です: ${version} (正しい形式: X.Y.Z)\n`);
		process.exit(1);
	}
}

// Gitコミット履歴を取得
function getGitCommits(fromTag, toTag = "HEAD") {
	try {
		let command;
		if (fromTag) {
			command = `git log ${fromTag}..${toTag} --oneline --no-merges --reverse`;
		} else {
			command = "git log --oneline --no-merges -n 20 --reverse";
		}

		const output = execSync(command, { encoding: "utf8" }).trim();
		return output ? output.split("\n") : [];
	} catch (_error) {
		return [];
	}
}

// コミットメッセージを分類
function categorizeCommits(commits) {
	const categories = {
		features: [],
		bugfixes: [],
		improvements: [],
		others: [],
	};

	for (const commit of commits) {
		const message = commit.split(" ").slice(1).join(" ");
		const lowerMessage = message.toLowerCase();

		if (
			lowerMessage.includes("feat") ||
			lowerMessage.includes("add") ||
			lowerMessage.includes("新機能")
		) {
			categories.features.push(message);
		} else if (
			lowerMessage.includes("fix") ||
			lowerMessage.includes("修正") ||
			lowerMessage.includes("バグ")
		) {
			categories.bugfixes.push(message);
		} else if (
			lowerMessage.includes("improve") ||
			lowerMessage.includes("改善") ||
			lowerMessage.includes("最適化")
		) {
			categories.improvements.push(message);
		} else {
			categories.others.push(message);
		}
	}

	return categories;
}

// コミットから更新履歴を生成
function generateChangelogFromCommits(version, commits) {
	const categories = categorizeCommits(commits);
	const [major, minor, patch] = version.split(".").map(Number);

	// バージョンタイプを判定
	let type = "patch";
	if (major > 0 && minor === 0 && patch === 0) type = "major";
	else if (minor > 0 && patch === 0) type = "minor";

	// カテゴリを判定
	let category = "feature";
	if (categories.bugfixes.length > categories.features.length) category = "bugfix";

	let content = `---
title: "バージョン ${version} リリース"
description: "Gitコミット履歴から自動生成された更新履歴です。"
version: "${version}"
releaseDate: "${new Date().toISOString().split("T")[0]}"
type: "${type}"
category: "${category}"
highlights:`;

	// ハイライトを生成
	const highlights = [];
	if (categories.features.length > 0) highlights.push(`"新機能 ${categories.features.length}件"`);
	if (categories.bugfixes.length > 0) highlights.push(`"バグ修正 ${categories.bugfixes.length}件"`);
	if (categories.improvements.length > 0)
		highlights.push(`"改善 ${categories.improvements.length}件"`);

	for (const highlight of highlights) {
		content += `\n  - ${highlight}`;
	}

	content += `
breaking: false
---

# バージョン ${version} リリースノート

*このリリースノートはGitコミット履歴から自動生成されました。*

`;

	// 新機能セクション
	if (categories.features.length > 0) {
		content += `## 🎉 新機能

<Accordion title="新機能一覧" defaultOpen={true}>

`;
		for (const feature of categories.features) {
			content += `- ${feature}\n`;
		}
		content += `
</Accordion>

`;
	}

	// バグ修正セクション
	if (categories.bugfixes.length > 0) {
		content += `## 🐛 バグ修正

<Accordion title="修正一覧">

`;
		for (const fix of categories.bugfixes) {
			content += `- ${fix}\n`;
		}
		content += `
</Accordion>

`;
	}

	// 改善セクション
	if (categories.improvements.length > 0) {
		content += `## 🔧 改善

<Accordion title="改善一覧">

`;
		for (const improvement of categories.improvements) {
			content += `- ${improvement}\n`;
		}
		content += `
</Accordion>

`;
	}

	// その他の変更
	if (categories.others.length > 0) {
		content += `## 🛠 その他の変更

<Accordion title="その他の変更">

`;
		for (const other of categories.others) {
			content += `- ${other}\n`;
		}
		content += `
</Accordion>

`;
	}

	content += `---

このリリースは ${commits.length} 件のコミットを含んでいます。`;

	return content;
}

// 新しい更新履歴ファイルを作成
function createChangelog(version) {
	validateVersion(version);

	const filename = `${version.replace(/\./g, "-")}.mdx`;
	const filepath = path.join(CHANGELOG_DIR, filename);

	if (fs.existsSync(filepath)) {
		process.stderr.write(`Error: 更新履歴ファイルは既に存在します: ${filepath}\n`);
		process.exit(1);
	}

	const content = CHANGELOG_TEMPLATE(version);

	if (!fs.existsSync(CHANGELOG_DIR)) {
		fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
	}

	fs.writeFileSync(filepath, content, "utf8");
	console.log(`✅ 更新履歴テンプレートを作成しました: ${filepath}`);
}

// Gitコミットから更新履歴を生成
async function generateChangelog(version, fromVersion, useAI = true) {
	// バージョンが指定されていない場合はpackage.jsonから取得
	if (!version) {
		const version = getPackageVersion();
		console.log(`📦 package.jsonからバージョンを取得: ${version}`);
	} else {
		validateVersion(version);
	}

	const filename = `${version.replace(/\./g, "-")}.mdx`;
	const filepath = path.join(CHANGELOG_DIR, filename);

	if (fs.existsSync(filepath)) {
		process.stderr.write(`Error: 更新履歴ファイルは既に存在します: ${filepath}\n`);
		process.exit(1);
	}

	// 前のバージョンタグを取得
	let fromTag = null;
	if (fromVersion) {
		fromTag = `v${fromVersion}`;
	} else {
		try {
			const tags = execSync("git tag --sort=-version:refname", { encoding: "utf8" })
				.trim()
				.split("\n");
			if (tags.length > 0 && tags[0]) {
				fromTag = tags[0];
			}
		} catch {
			console.log("⚠️  既存のタグが見つかりません。最新20件のコミットから生成します。");
		}
	}

	console.log(`📝 コミット履歴を取得中... ${fromTag ? `(${fromTag} から)` : "(最新20件)"}`);
	const commits = getGitCommits(fromTag);

	if (commits.length === 0) {
		process.stderr.write("Error: コミットが見つかりませんでした。\n");
		process.exit(1);
	}

	console.log(`📊 ${commits.length} 件のコミットを発見しました`);

	let content;
	if (useAI) {
		// Gemini AIで生成
		content = await generateChangelogWithGemini(commits, version);
		if (!content) {
			console.log("🔄 AIでの生成に失敗しました。従来の方法で生成します...");
			content = generateChangelogFromCommits(version, commits);
		} else {
			console.log("🤖 Gemini AIでの生成が完了しました");
		}
	} else {
		// 従来の方法で生成
		content = generateChangelogFromCommits(version, commits);
	}

	if (!fs.existsSync(CHANGELOG_DIR)) {
		fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
	}

	fs.writeFileSync(filepath, content, "utf8");
	console.log(`✅ 更新履歴を生成しました: ${filepath}`);
	console.log("💡 ファイルを確認して、必要に応じて内容を編集してください。");
}

// テンプレートを表示
function showTemplate() {
	console.log("📋 更新履歴テンプレート:");
	console.log("");
	console.log(CHANGELOG_TEMPLATE("1.0.0"));
}

// ヘルプを表示
function showHelp() {
	console.log(`
📚 更新履歴管理CLI

使用方法:
  bun scripts/changelog-manager.js create <version>           新しい更新履歴テンプレートを作成
  bun scripts/changelog-manager.js generate [version] [from] Gitコミットから更新履歴を生成（Gemini AI使用）
  bun scripts/changelog-manager.js generate-simple [version] [from] 従来の方法で更新履歴を生成
  bun scripts/changelog-manager.js template                  テンプレートを表示
  bun scripts/changelog-manager.js help                      このヘルプを表示

例:
  bun scripts/changelog-manager.js create 1.2.3
  bun scripts/changelog-manager.js generate                   # package.jsonのバージョンを使用
  bun scripts/changelog-manager.js generate 1.2.3
  bun scripts/changelog-manager.js generate 1.2.3 1.2.2
  bun scripts/changelog-manager.js generate-simple 1.2.3     # AI機能を使わない
  bun scripts/changelog-manager.js template

オプション:
  <version>  セマンティックバージョン形式 (例: 1.2.3) - 省略時はpackage.jsonから取得
  [from]     比較元のバージョン (省略時は最新タグから)

環境変数:
  GOOGLE_AI_API_KEY  Gemini APIキー（AI生成機能を使用する場合）
`);
}

// メイン処理
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		showHelp();
		return;
	}

	const command = args[0];

	switch (command) {
		case "create":
			if (args.length < 2) {
				process.stderr.write("Error: バージョンを指定してください。 例: create 1.2.3\n");
				process.exit(1);
			}
			createChangelog(args[1]);
			break;

		case "generate":
			// バージョンが指定されていない場合はpackage.jsonから取得
			await generateChangelog(args[1], args[2], true);
			break;

		case "generate-simple":
			if (args.length < 2) {
				process.stderr.write("Error: バージョンを指定してください。 例: generate-simple 1.2.3\n");
				process.exit(1);
			}
			await generateChangelog(args[1], args[2], false);
			break;

		case "template":
			showTemplate();
			break;

		case "help":
		case "--help":
		case "-h":
			showHelp();
			break;

		default:
			process.stderr.write(`Error: 不明なコマンドです: ${command}\n`);
			showHelp();
			process.exit(1);
	}
}

// ES Moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { createChangelog, generateChangelog, showHelp, showTemplate };
