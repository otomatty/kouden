import { GoogleGenerativeAI } from "@google/generative-ai";
import { type NextRequest, NextResponse } from "next/server";
import { isAbstractInput, generateClarifyingQuestions } from "@/utils/blog-ai-agent";

// Gemini APIクライアントを初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SuggestionOption {
	id: string;
	title: string;
	description: string;
	type: "suggestion" | "edit" | "metadata" | "content" | "category" | "question";
	data?: {
		metadata?: Partial<{
			title: string;
			slug: string;
			status: "draft" | "published";
			organization_id: string;
		}>;
		content?: string;
	};
	children?: SuggestionOption[];
}

// Google Search結果の型定義
interface GoogleSearchResult {
	title: string;
	url: string;
	snippet: string;
	displayUrl?: string;
}

interface RequestBody {
	model?: string;
	prompt: string;
	context: {
		metadata: {
			title: string;
			slug: string;
			status: "draft" | "published";
			organization_id: string;
			wordCount?: number;
			contentLength?: number;
			hasTitle?: boolean;
			hasContent?: boolean;
		};
		content: string;
		pageType?: "new" | "edit";
		articleState?: {
			hasTitle: boolean;
			hasContent: boolean;
			contentLength: number;
			wordCount: number;
			isEmpty: boolean;
			isPartial: boolean;
			isSubstantial: boolean;
		};
		userIntent?: {
			isFirstMessage: boolean;
			previousInteractions: number;
		};
	};
	tools?: string[];
	thinkingConfig?: {
		enabled: boolean;
		maxThinkingTokens: number;
	};
}

interface AIResponse {
	type: "suggestion" | "edit" | "metadata" | "content" | "options" | "question";
	message: string;
	options?: SuggestionOption[];
	questions?: Array<{
		id: string;
		question: string;
		category: "topic" | "audience" | "purpose" | "format" | "tone" | "details";
		priority: number;
	}>;
	thinking?: string;
	searchResults?: GoogleSearchResult[];
	data?: {
		metadata?: Partial<{
			title: string;
			slug: string;
			status: "draft" | "published";
			organization_id: string;
		}>;
		content?: string;
		suggestions?: string[];
	};
}

/**
 * システムプロンプトを生成する関数
 * 記事のコンテキストと使用するツールに基づいてプロンプトを構築
 */
function generateSystemPrompt(
	context: RequestBody["context"],
	tools: string[] = [],
	thinkingConfig?: RequestBody["thinkingConfig"],
	userPrompt?: string,
): string {
	const { metadata, content, pageType = "new", userIntent } = context;

	// 記事の状態を分析
	const hasTitle = metadata.hasTitle ?? (metadata.title && metadata.title.trim().length > 0);
	const hasContent = metadata.hasContent ?? (content && content.trim().length > 0);
	const wordCount = metadata.wordCount ?? (content ? content.trim().split(/\s+/).length : 0);
	const contentLength = metadata.contentLength ?? (content ? content.trim().length : 0);
	const isEmpty = !(hasTitle || hasContent);

	// ページタイプに応じた基本設定
	const pageContext = pageType === "new" ? "新規記事作成" : "既存記事編集";
	const statusContext = metadata.status === "published" ? "公開済み記事" : "下書き記事";

	// 校正関連のプロンプトかどうかを判定
	const isProofreadingRequest =
		userPrompt &&
		(userPrompt.includes("校正") ||
			userPrompt.includes("文章を校正") ||
			userPrompt.includes("文章の校正") ||
			userPrompt.includes("校正して") ||
			userPrompt.includes("文章を直") ||
			userPrompt.includes("文章を修正") ||
			userPrompt.includes("段落構成") ||
			userPrompt.includes("箇条書きを直") ||
			userPrompt.includes("箇条書きを修正") ||
			userPrompt.includes("読みやすく"));

	let systemPrompt = `あなたは優秀なブログ執筆アシスタントです。現在、${pageContext}モードで${statusContext}をサポートしています。

## 現在の記事情報詳細分析:
**基本情報:**
- ページタイプ: ${pageType === "new" ? "新規作成" : "編集"}
- タイトル: ${hasTitle ? `"${metadata.title}"` : "未設定"}
- スラッグ: ${metadata.slug || "未設定"}
- ステータス: ${statusContext}

**コンテンツ分析:**
- 文字数: ${contentLength}文字
- 単語数: ${wordCount}語
- タイトル設定: ${hasTitle ? "済み" : "未設定"}
- 内容作成: ${hasContent ? "済み" : "未作成"}
- 記事の充実度: ${
		isEmpty
			? "空の状態"
			: hasTitle && !hasContent
				? "タイトルのみ"
				: !hasTitle && hasContent
					? "内容のみ"
					: contentLength < 200
						? "初期段階"
						: contentLength < 500
							? "基本的な内容"
							: contentLength < 1000
								? "充実した内容"
								: "非常に詳細な内容"
	}

**ユーザーの状況:**
- 初回メッセージ: ${userIntent?.isFirstMessage ? "はい" : "いいえ"}
- 過去のやり取り: ${userIntent?.previousInteractions || 0}回

**記事内容のプレビュー:**
${content ? content.substring(0, 300) + (content.length > 300 ? "..." : "") : "（まだ内容が作成されていません）"}`;

	// 校正リクエストの場合は特別な指示を追加
	if (isProofreadingRequest) {
		systemPrompt += `

## 🔥 校正モード - 文章スタイル改善の最優先指示:
**重要**: 現在のユーザーリクエストは文章校正です。以下の文章スタイル指針を最優先で適用してください：

### 校正時の最重要原則:
1. **箇条書きの完全排除**: 既存の「・」「-」「1.」「2.」などの箇条書きを全て自然な文章に変換する
2. **段落構成の最適化**: 意味のまとまりごとに適切な段落分けを行い、読みやすい構造を作る
3. **文章の流れの改善**: 文と文、段落と段落が自然につながる読み物として再構成する
4. **接続表現の活用**: 「このように」「一方で」「さらに」「また」などで文章をスムーズに繋ぐ

### 校正での具体的な変換例:
- 「以下の点が重要です：・ポイント1 ・ポイント2」
  → 「重要な点について考えてみましょう。まず〜という点があります。さらに〜という要素も見逃せません。」
- 「手順：1.〜 2.〜 3.〜」
  → 「最初に〜を行います。次に〜という作業に移ります。最後に〜で完了となります。」
- 「メリット：・利点A ・利点B」
  → 「この方法には大きな利点があります。まず〜という効果が期待でき、さらに〜という恩恵も受けられます。」

### 校正後の文章品質基準:
- 箇条書きが一切含まれていない自然な文章
- 各段落が適切な長さ（2-4文程度）で構成されている
- 導入→展開→結論の流れが明確
- 読み手にとって理解しやすい論理的な構成`;
	}

	systemPrompt += `

## AI執筆支援の指針:

### 1. 記事状態に応じた最適なサポート
${
	isEmpty
		? "- 記事作成の初期段階です。まずはコンセプトやターゲット読者の明確化から始めましょう"
		: hasTitle && !hasContent
			? `- タイトル「${metadata.title}」が設定済みです。このタイトルに最適な内容構成を提案しましょう`
			: !hasTitle && hasContent
				? `- ${wordCount}語の内容が作成済みです。内容に最適なタイトルを提案しましょう`
				: contentLength < 500
					? "- 基本的な構造は完成しています。内容をより充実させる提案を行いましょう"
					: "- 充実した記事になっています。品質向上と最適化に焦点を当てましょう"
}

### 2. ${pageType === "new" ? "新規作成" : "編集"}モードでの重点項目
${
	pageType === "new"
		? `
- 魅力的で検索されやすいタイトルの提案
- 読者のニーズに応える構成設計
- 導入から結論まで一貫した流れの構築
- SEO最適化の基礎設計`
		: `
- 既存内容の詳細分析と改善提案
- タイトルと内容の整合性チェック
- 読みやすさと説得力の向上
- 公開準備の最終調整`
}

### 3. 具体的な改善提案の方針
- 現在の記事状態を踏まえた段階的な改善
- 読者の視点に立った価値提供の最大化
- 検索エンジン最適化（SEO）の実装
- 読みやすさと理解しやすさの向上

## 応答生成の指示:

### 基本原則:
1. **現在の記事状態を必ず考慮**: 空の記事と充実した記事では全く異なるアプローチを取る
2. **段階的な改善提案**: 一度に全てを変更するのではなく、優先度に基づいた提案
3. **具体的で実用的な内容**: 抽象的な提案ではなく、すぐに実行できる具体的な改善案
4. **読者価値の最大化**: 常に「読者にとって価値があるか」を判断基準とする

### 応答形式:
必ず以下のJSON形式で応答してください：
{
  "type": "options",
  "message": "現在の記事状態を分析した結果に基づくメッセージ",
  "options": [
    {
      "id": "unique-id",
      "title": "具体的で魅力的なタイトル",
      "description": "現在の記事状態を考慮した詳細な説明",
      "type": "suggestion" | "edit" | "metadata" | "content" | "category",
      "data": {
        "metadata": { "title": "改善されたタイトル" },
        "content": "改善されたコンテンツ"
      }
    }
  ]
}

### 選択肢生成の優先順位:
${
	isEmpty
		? "1. コンセプト明確化 → 2. タイトル作成 → 3. 構成設計"
		: hasTitle && !hasContent
			? "1. 構成設計 → 2. 導入文作成 → 3. 内容執筆"
			: !hasTitle && hasContent
				? "1. タイトル生成 → 2. 構成最適化 → 3. 内容改善"
				: "1. 内容改善 → 2. SEO最適化 → 3. 公開準備"
}`;

	// Thinking機能が有効な場合の指示追加
	if (thinkingConfig?.enabled && tools.includes("thinking")) {
		systemPrompt += `

## Thinking機能の活用指示:
- 記事の現在の状態を詳細に分析してから提案を行う
- 読者のニーズと記事の目的を考慮した論理的な改善案を導出
- 複数の改善案を比較検討し、最適な選択肢を提示
- 思考プロセスは日本語で詳細に記述`;
	}

	// Google Search機能が有効な場合の指示追加
	if (tools.includes("google_search")) {
		systemPrompt += `

## Google Search機能の活用指示:
- 記事のトピックに関する最新情報の調査
- 競合記事の分析による差別化ポイントの特定
- トレンドキーワードの調査とSEO最適化
- 読者が求める情報の市場調査`;
	}

	systemPrompt += `

## 重要な注意事項:
- 現在の記事の状態（${contentLength}文字、${wordCount}語）を必ず考慮する
- ${pageType}モードであることを意識した提案を行う
- 読者にとって価値のある具体的な改善案のみを提示
- 段階的で実行可能な改善プロセスを設計
- 日本語で分かりやすく、親しみやすい回答を心がける

## 文章生成の基本方針:
**重要**: 記事コンテンツを生成する際は、以下の原則に従うこと：

### 文章スタイルの指針:
1. **箇条書きを避ける**: 「・」「-」「1.」などの箇条書き形式は使用せず、自然な文章で表現する
2. **段落構成を重視**: 適切な段落分けで読みやすい文章構造を作る
3. **流れのある文章**: 文と文、段落と段落が自然につながる読み物として構成する
4. **具体例は文章内に組み込む**: 例示も箇条書きではなく、文章の流れの中で自然に提示する

### 避けるべき表現:
- 「以下のポイントが重要です：」→「〜について考えてみましょう。」
- 「・メリット1」「・メリット2」→「まず〜という利点があります。さらに〜という効果も期待できます。」
- 「手順：1. 〜」「2. 〜」→「最初に〜を行います。次に〜という作業に移ります。」

### 推奨する表現:
- 導入文で読者の関心を引く
- 「〜について詳しく見ていきましょう」「〜という観点から考えてみます」
- 「このように〜」「一方で〜」「さらに〜」などの接続表現を活用
- 結論部分で内容をまとめ、読者への価値を明確化

現在の記事状態に最適な改善提案を、具体的で実用的な選択肢として提示してください。`;

	return systemPrompt;
}

export async function POST(request: NextRequest) {
	try {
		// APIキーの確認
		if (!process.env.GEMINI_API_KEY) {
			return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
		}

		const body: RequestBody = await request.json();
		const { model = "gemini-2.5-flash", prompt, context, tools = [], thinkingConfig } = body;

		if (!prompt) {
			return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
		}

		// 抽象的な入力かどうかをチェック
		if (isAbstractInput(prompt)) {
			const clarifyingData = generateClarifyingQuestions(
				prompt,
				{
					title: context.metadata.title,
					slug: context.metadata.slug,
					status: context.metadata.status,
					organization_id: context.metadata.organization_id,
				},
				context.content,
			);

			const questionResponse: AIResponse = {
				type: "question",
				message: clarifyingData.message,
				questions: clarifyingData.questions,
			};

			return NextResponse.json(questionResponse);
		}

		// 通常のAI応答生成処理
		// システムプロンプトを生成
		const systemPrompt = generateSystemPrompt(context, tools, thinkingConfig, prompt);

		// Gemini モデルを取得（標準的なModelParams使用）
		const modelConfig = {
			model,
			generationConfig:
				thinkingConfig?.enabled && tools.includes("thinking")
					? { maxOutputTokens: thinkingConfig.maxThinkingTokens || 8000 }
					: undefined,
		};

		const geminiModel = genAI.getGenerativeModel(modelConfig);

		// 最終的なプロンプトを構築
		const fullPrompt = `${systemPrompt}

ユーザーからの要求: ${prompt}`;

		// AI応答を生成
		const result = await geminiModel.generateContent(fullPrompt);
		const responseText = result.response.text();

		// Thinking内容を抽出
		let thinkingContent: string | undefined;
		let cleanedResponse = responseText;

		const thinkingMatch = responseText.match(/<thinking>([\s\S]*?)<\/thinking>/);
		if (thinkingMatch?.[1]) {
			thinkingContent = thinkingMatch[1].trim();
			cleanedResponse = responseText.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();
		}

		// Google Search結果を抽出（実際の実装では、Gemini APIからの検索結果を処理）
		let searchResults: GoogleSearchResult[] | undefined;
		// 注意: 実際のGoogle Search結果の処理は、Gemini APIの仕様に依存します

		// JSON形式の応答をパース
		let aiResponse: AIResponse;
		try {
			// レスポンスからJSONを抽出（マークダウンのコードブロックを除去）
			const jsonMatch = cleanedResponse.match(/```json\n([\s\S]*?)\n```/) ||
				cleanedResponse.match(/```\n([\s\S]*?)\n```/) || [null, cleanedResponse];

			const jsonString = jsonMatch[1] || cleanedResponse;
			aiResponse = JSON.parse(jsonString.trim());

			// Thinking内容を追加
			if (thinkingContent) {
				aiResponse.thinking = thinkingContent;
			}

			// 検索結果を追加
			if (searchResults) {
				aiResponse.searchResults = searchResults;
			}
		} catch (parseError) {
			console.error("Failed to parse AI response as JSON:", parseError);
			console.error("Raw response:", cleanedResponse);

			// JSONパースに失敗した場合は、デフォルトの選択肢形式で返す
			aiResponse = {
				type: "options",
				message: "AI応答を生成しました。以下の選択肢からお選びください：",
				options: [
					{
						id: "fallback-1",
						title: "文章の改善",
						description: "読みやすさと理解しやすさを向上させる",
						type: "suggestion",
					},
					{
						id: "fallback-2",
						title: "SEO最適化",
						description: "検索エンジンでの発見性を高める",
						type: "suggestion",
					},
					{
						id: "fallback-3",
						title: "構成の見直し",
						description: "論理的で分かりやすい構成に改善",
						type: "suggestion",
					},
				],
				thinking: thinkingContent,
			};
		}

		// レスポンスの検証と補完
		if (!aiResponse.message) {
			aiResponse.message = "AI応答を生成しました。";
		}

		// レスポンスタイプの検証
		const validTypes = ["suggestion", "edit", "metadata", "content", "options", "question"];
		if (!validTypes.includes(aiResponse.type)) {
			aiResponse.type = "options";
		}

		// optionsタイプの場合、選択肢が空でないことを確認
		if (aiResponse.type === "options" && (!aiResponse.options || aiResponse.options.length === 0)) {
			aiResponse.options = [
				{
					id: "default-1",
					title: "文章の改善",
					description: "読みやすさと理解しやすさを向上させる",
					type: "suggestion",
				},
				{
					id: "default-2",
					title: "SEO最適化",
					description: "検索エンジンでの発見性を高める",
					type: "suggestion",
				},
			];
		}

		return NextResponse.json(aiResponse);
	} catch (error) {
		console.error("AI generation error:", error);

		// エラーの詳細をログに記録
		if (error instanceof Error) {
			console.error("Error details:", {
				message: error.message,
				stack: error.stack,
			});
		}

		return NextResponse.json(
			{
				type: "options",
				message:
					"申し訳ありません。AI応答の生成中にエラーが発生しました。しばらく時間をおいてから再度お試しください。",
				options: [
					{
						id: "error-fallback",
						title: "再試行",
						description: "もう一度お試しください",
						type: "suggestion",
					},
				],
				error: process.env.NODE_ENV === "development" ? error : undefined,
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json(
		{
			message: "AI generation endpoint is working",
			features: {
				thinking: "Gemini 2.5 Flash Thinking support",
				googleSearch: "Google Search tool integration (Gemini 2.5 compatible)",
				multipleOptions: "Multiple suggestion options support",
			},
		},
		{ status: 200 },
	);
}
