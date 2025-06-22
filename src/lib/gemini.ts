import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

/**
 * Gemini APIクライアント
 *
 * 環境変数 GEMINI_API_KEY または GOOGLE_AI_API_KEY から API キーを取得
 * 複数の環境変数名に対応して柔軟性を向上
 */
class GeminiClient {
	private genAI: GoogleGenerativeAI;

	constructor() {
		// 複数の環境変数名をサポート
		const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

		if (!apiKey) {
			throw new Error(
				"Gemini API key is not configured. Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable.",
			);
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
	}

	/**
	 * Geminiモデルを取得
	 * @param model モデル名（デフォルト: gemini-2.5-flash）
	 * @param config 追加の設定オプション
	 * @returns GenerativeModel インスタンス
	 */
	getModel(
		model = "gemini-2.5-flash",
		config?: {
			generationConfig?: {
				maxOutputTokens?: number;
				temperature?: number;
				topP?: number;
				topK?: number;
			};
		},
	): GenerativeModel {
		return this.genAI.getGenerativeModel({
			model,
			...config,
		});
	}

	/**
	 * APIキーが設定されているかチェック
	 * @returns APIキーの設定状況
	 */
	isConfigured(): boolean {
		return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
	}

	/**
	 * 利用可能なモデル一覧
	 */
	static readonly MODELS = {
		FLASH: "gemini-2.5-flash",
		PRO: "gemini-2.5-pro",
		FLASH_THINKING: "gemini-2.5-flash-thinking",
	} as const;
}

// シングルトンインスタンスを作成
let geminiClientInstance: GeminiClient | null = null;

/**
 * Geminiクライアントのシングルトンインスタンスを取得
 * @returns GeminiClient インスタンス
 */
export function getGeminiClient(): GeminiClient {
	if (!geminiClientInstance) {
		geminiClientInstance = new GeminiClient();
	}
	return geminiClientInstance;
}

/**
 * 簡単にモデルを取得するためのヘルパー関数
 * @param model モデル名（デフォルト: gemini-2.5-flash）
 * @param config 追加の設定オプション
 * @returns GenerativeModel インスタンス
 */
export function getGeminiModel(
	model?: string,
	config?: Parameters<GeminiClient["getModel"]>[1],
): GenerativeModel {
	return getGeminiClient().getModel(model, config);
}

/**
 * APIキーが設定されているかチェックするヘルパー関数
 * @returns APIキーの設定状況
 */
export function isGeminiConfigured(): boolean {
	try {
		return getGeminiClient().isConfigured();
	} catch {
		return false;
	}
}

// よく使用される設定のプリセット
export const GEMINI_CONFIGS = {
	// 標準的な生成設定
	DEFAULT: {
		generationConfig: {
			temperature: 0.7,
			topP: 0.8,
			topK: 40,
		},
	},
	// 創作的な内容生成用
	CREATIVE: {
		generationConfig: {
			temperature: 0.9,
			topP: 0.9,
			topK: 50,
		},
	},
	// 正確性重視の設定
	PRECISE: {
		generationConfig: {
			temperature: 0.3,
			topP: 0.6,
			topK: 20,
		},
	},
	// 長文生成用
	LONG_FORM: {
		generationConfig: {
			maxOutputTokens: 8000,
			temperature: 0.7,
			topP: 0.8,
		},
	},
	// Thinking機能用
	THINKING: {
		generationConfig: {
			maxOutputTokens: 4000,
			temperature: 0.7,
		},
	},
} as const;

export { GeminiClient };
export type { GenerativeModel };
