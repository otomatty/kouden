import { type NextRequest, NextResponse } from "next/server";
import { getGeminiModel, isGeminiConfigured, GEMINI_CONFIGS } from "@/lib/gemini";

interface TranslateRequestBody {
	text: string;
	targetLanguage: string;
}

export async function POST(request: NextRequest) {
	try {
		// APIキーの確認
		if (!isGeminiConfigured()) {
			return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
		}

		const body: TranslateRequestBody = await request.json();
		const { text, targetLanguage } = body;

		if (!text) {
			return NextResponse.json({ error: "Text is required" }, { status: 400 });
		}

		// Gemini モデルを取得（翻訳には正確性重視の設定を使用）
		const model = getGeminiModel(undefined, GEMINI_CONFIGS.PRECISE);

		// 翻訳プロンプトを構築
		const prompt = `以下の日本語テキストを英語に翻訳してください。翻訳結果のみを返してください。追加の説明は不要です。

日本語テキスト: ${text}

翻訳結果:`;

		// AI応答を生成
		const result = await model.generateContent(prompt);
		const translatedText = result.response.text().trim();

		return NextResponse.json({
			translatedText,
			originalText: text,
			targetLanguage,
		});
	} catch (error) {
		console.error("Translation error:", error);

		return NextResponse.json(
			{
				error: "Translation failed",
				translatedText: null,
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json(
		{
			message: "Translation endpoint is working",
			supportedLanguages: ["english", "japanese"],
		},
		{ status: 200 },
	);
}
