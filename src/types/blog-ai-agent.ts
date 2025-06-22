export interface BlogMetadata {
	title: string;
	slug: string;
	status: "draft" | "published";
	organization_id: string;
}

export interface SuggestionOption {
	id: string;
	title: string;
	description: string;
	type: "suggestion" | "edit" | "metadata" | "content" | "category" | "question";
	data?: {
		metadata?: Partial<BlogMetadata>;
		content?: string;
	};
	// 階層構造をサポートするための子選択肢
	children?: SuggestionOption[];
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	type?: "suggestion" | "edit" | "metadata" | "content" | "options" | "question";
	options?: SuggestionOption[];
	selectedOptionId?: string;
	// 逆質問用のフィールド
	questions?: ClarifyingQuestion[];
	isFollowUp?: boolean; // フォローアップ質問かどうか
	// やり直し機能用のフィールド
	canRetry?: boolean; // このメッセージからやり直し可能かどうか
	isRetryPoint?: boolean; // やり直しポイントとしてマークされているか
}

export interface BlogAIAgentProps {
	metadata: BlogMetadata;
	content: string;
	onMetadataChange: (metadata: BlogMetadata) => void;
	onContentChange: (content: string) => void;
	pageType?: "new" | "edit";
	className?: string;
}

export interface AIResponse {
	type: "suggestion" | "edit" | "metadata" | "content" | "options" | "question";
	message: string;
	options?: SuggestionOption[];
	questions?: ClarifyingQuestion[];
	data?: {
		metadata?: Partial<BlogMetadata>;
		content?: string;
		suggestions?: string[];
	};
}

export interface ArticleState {
	hasTitle: boolean;
	hasContent: boolean;
	contentLength: number;
	wordCount: number;
	isEmpty: boolean;
	isPartial: boolean;
	isSubstantial: boolean;
}

/**
 * 逆質問の型定義
 */
export interface ClarifyingQuestion {
	id: string;
	question: string;
	category: "topic" | "audience" | "purpose" | "format" | "tone" | "details";
	priority: number;
	answered?: boolean;
	answer?: string;
}
