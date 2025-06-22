import type { BlogMetadata, AIResponse } from "@/types/blog-ai-agent";

interface CallAIParams {
	userMessage: string;
	metadata: BlogMetadata;
	content: string;
	pageType: "new" | "edit";
	messagesLength: number;
	// 逆質問に対する回答を含む場合
	questionAnswers?: Array<{
		questionId: string;
		answer: string;
		category: string;
	}>;
}

export async function callAI(params: CallAIParams): Promise<AIResponse> {
	const { userMessage, metadata, content, pageType, messagesLength, questionAnswers } = params;

	// 記事の状態を分析
	const hasTitle = metadata.title && metadata.title.trim().length > 0;
	const hasContent = content && content.trim().length > 0;
	const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
	const contentLength = content ? content.trim().length : 0;

	// リクエストボディを構築
	const requestBody = {
		model: "gemini-2.5-flash",
		prompt: userMessage,
		context: {
			metadata: {
				title: metadata.title,
				slug: metadata.slug,
				status: metadata.status,
				organization_id: metadata.organization_id,
				wordCount,
				contentLength,
				hasTitle,
				hasContent,
			},
			content,
			pageType,
			articleState: {
				hasTitle,
				hasContent,
				contentLength,
				wordCount,
				isEmpty: !(hasTitle || hasContent),
				isPartial: (hasTitle && !hasContent) || (!hasTitle && hasContent),
				isSubstantial: contentLength > 500,
			},
			userIntent: {
				isFirstMessage: messagesLength <= 1,
				previousInteractions: Math.max(0, messagesLength - 1),
			},
			// 逆質問の回答があれば含める
			questionAnswers,
		},
		tools: ["thinking"],
		thinkingConfig: {
			enabled: true,
			maxThinkingTokens: 4000,
		},
	};

	try {
		const response = await fetch("/api/ai/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const aiResponse: AIResponse = await response.json();
		return aiResponse;
	} catch (error) {
		console.error("Error calling AI service:", error);
		throw error;
	}
}

/**
 * 逆質問に対する回答を処理して具体的な提案を生成する
 */
export async function processQuestionAnswers(
	questionAnswers: Array<{
		questionId: string;
		answer: string;
		category: string;
	}>,
	metadata: BlogMetadata,
	content: string,
	pageType: "new" | "edit",
): Promise<AIResponse> {
	// 回答を整理してコンテキストに含める
	const answersContext = questionAnswers
		.map((qa) => `Q: ${qa.questionId} (${qa.category})\nA: ${qa.answer}`)
		.join("\n\n");

	const contextualPrompt = `以下の質問に対する回答を基に、具体的で実用的な提案を作成してください：

${answersContext}

これらの情報を活用して、最適な${metadata.title ? "内容改善" : "タイトルと構成"}の提案をお願いします。`;

	return callAI({
		userMessage: contextualPrompt,
		metadata,
		content,
		pageType,
		messagesLength: 0,
		questionAnswers,
	});
}
