#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

/**
 * マイルストーン管理CLI
 *
 * 使用方法:
 * bun scripts/milestone-manager.js create <period> - 新しいマイルストーンを作成
 * bun scripts/milestone-manager.js interactive - インタラクティブモードでマイルストーンを作成
 * bun scripts/milestone-manager.js template - テンプレートを表示
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MILESTONE_DIR = path.join(__dirname, "../src/docs/milestones");

// マイルストーンテンプレート
const MILESTONE_TEMPLATE = (data) => `---
title: "${data.title}"
description: "${data.description}"
period: "${data.period}"
targetDate: "${data.targetDate}"
status: "${data.status}"
priority: "${data.priority}"
features:${data.features.map((f) => `\n  - "${f}"`).join("")}
progress: ${data.progress}
category: "${data.category}"
---

# ${data.title}

${data.description}

## 🎯 主要目標

<Accordion title="主要機能の実装" defaultOpen={true} variant="bordered">

### 新機能・改善項目
${data.features.map((f) => `- ${f}`).join("\n")}

### 期待される成果
- ユーザー体験の向上
- システムパフォーマンスの改善
- 開発効率の向上

</Accordion>

<Accordion title="技術的詳細">

### 使用技術
- React 18
- Next.js 14
- TypeScript
- Tailwind CSS

### 新規導入予定
- 新しいライブラリやツールがあれば記載

</Accordion>

## 📅 開発スケジュール

| フェーズ | 期間 | 主要タスク |
|----------|------|------------|
| 設計・準備 | 第1週-第2週 | 要件定義、設計 |
| 実装 | 第3週-第6週 | 機能実装、テスト |
| 最終調整 | 第7週-第8週 | 品質保証、リリース準備 |

## 🚀 期待される効果

このマイルストーンの達成により、以下の効果を期待しています：

- ${data.expectedResults.join("\n- ")}

## 📊 進捗管理

進捗状況は定期的に更新され、主要なタスクの完了状況をリアルタイムで追跡できます。

---

*このマイルストーンは ${new Date().toLocaleDateString("ja-JP")} に作成されました。*
`;

// インタラクティブな入力を行う
function createReadlineInterface() {
	return readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
}

// 質問を行う
function question(rl, prompt) {
	return new Promise((resolve) => {
		rl.question(prompt, (answer) => {
			resolve(answer.trim());
		});
	});
}

// 複数行の入力を受け取る
async function multipleInput(rl, prompt, exitWord = "done") {
	console.log(`${prompt} (終了するには '${exitWord}' と入力)`);
	const items = [];
	let input;

	while (true) {
		input = await question(rl, "> ");
		if (input.toLowerCase() === exitWord.toLowerCase()) {
			break;
		}
		if (input) {
			items.push(input);
		}
	}

	return items;
}

/**
 * 期間の妥当性チェック
 * @param {string} period - 期間 (YYYY-QN または YYYY-MM 形式)
 */
function validatePeriod(period) {
	// YYYY-QN または YYYY-MM 形式をチェック
	const quarterRegex = /^\d{4}-q[1-4]$/i;
	const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

	if (!(quarterRegex.test(period) || monthRegex.test(period))) {
		console.error(
			"❌ 期間は YYYY-QN (例: 2025-q1) または YYYY-MM (例: 2025-01) 形式で指定してください",
		);
		process.exit(1);
	}
}

// 日付の妥当性チェック
function validateDate(dateString) {
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) {
		return false;
	}
	return true;
}

// デフォルト値を生成
function generateDefaults(period) {
	const currentYear = new Date().getFullYear();
	const isQuarter = period.includes("-q");

	let title;
	let targetDate;

	if (isQuarter) {
		const quarter = period.split("-q")[1];
		const quarterNames = { 1: "第1四半期", 2: "第2四半期", 3: "第3四半期", 4: "第4四半期" };
		title = `${currentYear}年${quarterNames[quarter]} マイルストーン`;

		// 四半期末の日付を計算
		const quarterEndMonths = { 1: "03", 2: "06", 3: "09", 4: "12" };
		const month = quarterEndMonths[quarter];
		const lastDay = new Date(currentYear, Number.parseInt(month), 0).getDate();
		targetDate = `${currentYear}-${month}-${lastDay}`;
	} else {
		const month = period.split("-")[1];
		const monthNames = {
			"01": "1月",
			"02": "2月",
			"03": "3月",
			"04": "4月",
			"05": "5月",
			"06": "6月",
			"07": "7月",
			"08": "8月",
			"09": "9月",
			10: "10月",
			11: "11月",
			12: "12月",
		};
		title = `${currentYear}年${monthNames[month]} マイルストーン`;

		// 月末の日付を計算
		const lastDay = new Date(currentYear, Number.parseInt(month), 0).getDate();
		targetDate = `${currentYear}-${month}-${lastDay}`;
	}

	return {
		title,
		description: "新機能とUI改善、パフォーマンス最適化を中心としたアップデート",
		targetDate,
		status: "planned",
		priority: "medium",
		features: ["新機能の実装", "UI/UX改善", "パフォーマンス最適化"],
		progress: 0,
		category: "feature",
		expectedResults: ["ユーザー満足度の向上", "システムパフォーマンスの改善", "開発効率の向上"],
	};
}

// インタラクティブモードでマイルストーンを作成
async function createInteractive() {
	const rl = createReadlineInterface();

	console.log("🚀 マイルストーン作成ウィザード");
	console.log("");

	try {
		// 基本情報の入力
		const period = await question(rl, "📅 期間を入力してください (例: 2025-q1, 2025-01): ");
		validatePeriod(period);

		const defaults = generateDefaults(period);

		const title = (await question(rl, `📝 タイトル [${defaults.title}]: `)) || defaults.title;
		const description =
			(await question(rl, `📄 説明 [${defaults.description}]: `)) || defaults.description;

		let targetDate;
		while (true) {
			targetDate =
				(await question(rl, `📆 目標日 (YYYY-MM-DD) [${defaults.targetDate}]: `)) ||
				defaults.targetDate;
			if (validateDate(targetDate)) {
				break;
			}
			console.log("❌ 無効な日付形式です。YYYY-MM-DD 形式で入力してください。");
		}

		// ステータス選択
		console.log("\n📊 ステータスを選択してください:");
		console.log("1. planned (計画中)");
		console.log("2. in-progress (進行中)");
		console.log("3. completed (完了)");
		const statusChoice = (await question(rl, "ステータス [1]: ")) || "1";
		const statusMap = { 1: "planned", 2: "in-progress", 3: "completed" };
		const status = statusMap[statusChoice] || "planned";

		// 優先度選択
		console.log("\n🔥 優先度を選択してください:");
		console.log("1. low (低)");
		console.log("2. medium (中)");
		console.log("3. high (高)");
		const priorityChoice = (await question(rl, "優先度 [2]: ")) || "2";
		const priorityMap = { 1: "low", 2: "medium", 3: "high" };
		const priority = priorityMap[priorityChoice] || "medium";

		// カテゴリ選択
		console.log("\n📂 カテゴリを選択してください:");
		console.log("1. feature (新機能)");
		console.log("2. improvement (改善)");
		console.log("3. infrastructure (インフラ)");
		const categoryChoice = (await question(rl, "カテゴリ [1]: ")) || "1";
		const categoryMap = { 1: "feature", 2: "improvement", 3: "infrastructure" };
		const category = categoryMap[categoryChoice] || "feature";

		// 進捗率
		let progress;
		while (true) {
			const progressInput = (await question(rl, "📈 進捗率 (0-100) [0]: ")) || "0";
			progress = Number.parseInt(progressInput);
			if (!Number.isNaN(progress) && progress >= 0 && progress <= 100) {
				break;
			}
			console.log("❌ 0から100の数値を入力してください。");
		}

		// 機能一覧
		console.log("\n🎯 主要機能を入力してください:");
		const features = await multipleInput(rl, "機能を1つずつ入力してください", "done");

		// 期待される結果
		console.log("\n🚀 期待される結果を入力してください:");
		const expectedResults = await multipleInput(
			rl,
			"期待される結果を1つずつ入力してください",
			"done",
		);

		const milestoneData = {
			title,
			description,
			period,
			targetDate,
			status,
			priority,
			features: features.length > 0 ? features : defaults.features,
			progress,
			category,
			expectedResults: expectedResults.length > 0 ? expectedResults : defaults.expectedResults,
		};

		// 確認
		console.log("\n📋 入力内容を確認してください:");
		console.log(`タイトル: ${milestoneData.title}`);
		console.log(`説明: ${milestoneData.description}`);
		console.log(`期間: ${milestoneData.period}`);
		console.log(`目標日: ${milestoneData.targetDate}`);
		console.log(`ステータス: ${milestoneData.status}`);
		console.log(`優先度: ${milestoneData.priority}`);
		console.log(`カテゴリ: ${milestoneData.category}`);
		console.log(`進捗: ${milestoneData.progress}%`);
		console.log(`機能: ${milestoneData.features.join(", ")}`);
		console.log(`期待される結果: ${milestoneData.expectedResults.join(", ")}`);

		const confirm = await question(rl, "\n✅ この内容でマイルストーンを作成しますか？ (y/N): ");

		if (confirm.toLowerCase() === "y" || confirm.toLowerCase() === "yes") {
			await createMilestoneFile(milestoneData);
			console.log("🎉 マイルストーンが作成されました！");
		} else {
			console.log("❌ マイルストーンの作成をキャンセルしました。");
		}
	} catch {
		console.error("❌ エラーが発生しました");
	} finally {
		rl.close();
	}
}

// マイルストーンファイルを作成
async function createMilestoneFile(data) {
	const filename = `${data.period}.mdx`;
	const filepath = path.join(MILESTONE_DIR, filename);

	if (fs.existsSync(filepath)) {
		throw new Error(`マイルストーン ${data.period} は既に存在します`);
	}

	const content = MILESTONE_TEMPLATE(data);

	if (!fs.existsSync(MILESTONE_DIR)) {
		fs.mkdirSync(MILESTONE_DIR, { recursive: true });
	}

	fs.writeFileSync(filepath, content, "utf8");
	console.log(`✅ マイルストーンを作成しました: ${filepath}`);
}

// テンプレートマイルストーンを作成
function createTemplate(period) {
	validatePeriod(period);

	const defaults = generateDefaults(period);
	const milestoneData = {
		...defaults,
		period,
	};

	createMilestoneFile(milestoneData)
		.then(() => {
			console.log("📝 テンプレートマイルストーンを作成しました。");
			console.log("💡 ファイルを編集して、詳細な内容を追加してください。");
		})
		.catch((error) => {
			console.error("❌ エラー:", error.message);
			process.exit(1);
		});
}

// テンプレートを表示
function showTemplate() {
	const sampleData = {
		title: "2025年第1四半期 マイルストーン",
		description: "新機能とUI改善、パフォーマンス最適化を中心としたアップデート",
		period: "2025-q1",
		targetDate: "2025-03-31",
		status: "planned",
		priority: "high",
		features: ["新機能の実装", "UI/UX改善", "パフォーマンス最適化"],
		progress: 0,
		category: "feature",
		expectedResults: ["ユーザー満足度の向上", "システムパフォーマンスの改善"],
	};

	console.log("📋 マイルストーンテンプレート:");
	console.log("");
	console.log(MILESTONE_TEMPLATE(sampleData));
}

// ヘルプを表示
function showHelp() {
	console.log(`
🎯 マイルストーン管理CLI

使用方法:
  bun scripts/milestone-manager.js create <period>      テンプレートマイルストーンを作成
  bun scripts/milestone-manager.js interactive         インタラクティブモードでマイルストーンを作成
  bun scripts/milestone-manager.js template            テンプレートを表示
  bun scripts/milestone-manager.js help                このヘルプを表示

例:
  bun scripts/milestone-manager.js create 2025-q1
  bun scripts/milestone-manager.js create 2025-01
  bun scripts/milestone-manager.js interactive
  bun scripts/milestone-manager.js template

オプション:
  <period>  期間 (例: 2025-q1, 2025-01)
  
期間の形式:
  - 四半期: YYYY-QN (例: 2025-q1, 2025-q2)
  - 月別: YYYY-MM (例: 2025-01, 2025-12)
`);
}

// メイン処理
function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		showHelp();
		return;
	}

	const command = args[0];

	switch (command) {
		case "create":
			if (args.length < 2) {
				console.error("❌ 期間を指定してください");
				process.exit(1);
			}
			createTemplate(args[1]);
			break;

		case "interactive":
			createInteractive();
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
			console.error(`❌ 不明なコマンド: ${command}`);
			showHelp();
			process.exit(1);
	}
}

// ES Moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { createInteractive, createMilestoneFile, createTemplate, showHelp, showTemplate };
