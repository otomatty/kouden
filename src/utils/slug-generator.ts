/**
 * タイトルからスラッグを生成するユーティリティ
 * 日本語タイトルの場合は英語に翻訳してからslugを生成
 */

/**
 * Gemini APIを使用して日本語を英語に翻訳
 */
async function translateToEnglish(japaneseText: string): Promise<string> {
	try {
		const response = await fetch("/api/ai/translate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: japaneseText,
				targetLanguage: "english",
			}),
		});

		if (!response.ok) {
			throw new Error("Translation failed");
		}

		const data = await response.json();
		return data.translatedText || japaneseText;
	} catch (error) {
		console.error("Translation error:", error);
		// 翻訳に失敗した場合は元のテキストを返す
		return japaneseText;
	}
}

/**
 * 英語テキストからスラッグを生成
 */
function createSlugFromEnglish(englishText: string): string {
	return englishText
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "") // 英数字とスペース、ハイフンのみ残す
		.replace(/\s+/g, "-") // スペースをハイフンに
		.replace(/-+/g, "-") // 連続するハイフンを1つに
		.replace(/^-+|-+$/g, "") // 先頭と末尾のハイフンを削除
		.trim();
}

/**
 * 日本語が含まれているかチェック
 */
function containsJapanese(text: string): boolean {
	return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

/**
 * タイトルからスラッグを生成（非同期版）
 * 日本語タイトルの場合は英語に翻訳してからslugを生成
 */
export async function generateSlugFromTitle(title: string): Promise<string> {
	if (!title.trim()) {
		return `post-${Date.now().toString().slice(-6)}`;
	}

	// 日本語が含まれているかチェック
	if (containsJapanese(title)) {
		try {
			// 日本語を英語に翻訳
			const englishTitle = await translateToEnglish(title);
			const slug = createSlugFromEnglish(englishTitle);

			// 翻訳結果が有効なslugを生成できた場合
			if (slug.length > 0) {
				return slug;
			}
		} catch (error) {
			console.error("Slug generation error:", error);
		}

		// 翻訳に失敗した場合のフォールバック
		const timestamp = Date.now().toString().slice(-6);
		return `post-${timestamp}`;
	}

	// 英語タイトルの場合は直接スラッグを生成
	const slug = createSlugFromEnglish(title);
	if (slug.length > 0) {
		return slug;
	}

	// 何も生成できなかった場合のフォールバック
	return `post-${Date.now().toString().slice(-6)}`;
}

/**
 * タイトルからスラッグを生成（同期版・フォールバック用）
 * 翻訳APIが使用できない場合の簡易版
 */
export function generateSlugFromTitleSync(title: string): string {
	if (!title.trim()) {
		return `post-${Date.now().toString().slice(-6)}`;
	}

	// 英数字のタイトルの場合
	const englishSlug = createSlugFromEnglish(title);
	if (englishSlug.length > 0) {
		return englishSlug;
	}

	// 日本語タイトルの場合は、タイムスタンプベースのスラッグを生成
	const timestamp = Date.now().toString().slice(-6);
	const titlePrefix = title.slice(0, 10).replace(/[^\w\s]/g, "");

	if (titlePrefix.length > 0) {
		return `post-${titlePrefix}-${timestamp}`.toLowerCase().replace(/\s+/g, "-");
	}

	return `post-${timestamp}`;
}
