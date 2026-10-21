import { KoudenError } from "@/lib/errors";

/**
 * よくある英語エラーメッセージの日本語訳。
 * 完全一致と部分一致の両方で使用する。
 */
const ENGLISH_TO_JAPANESE_MESSAGES: Array<{ pattern: RegExp; translation: string }> = [
	{ pattern: /^something went wrong$/i, translation: "予期せぬエラーが発生しました" },
	{ pattern: /^network error$/i, translation: "通信エラーが発生しました" },
	{ pattern: /^not authenticated$/i, translation: "認証が必要です" },
	{ pattern: /^user not authenticated\.?$/i, translation: "認証が必要です" },
	{ pattern: /^unauthorized$/i, translation: "認証が必要です" },
	{ pattern: /^forbidden$/i, translation: "この操作を行う権限がありません" },
	{ pattern: /^not found$/i, translation: "対象のデータが見つかりませんでした" },
	{ pattern: /failed to fetch/i, translation: "通信エラーが発生しました" },
	{
		pattern: /(?:request\s+timeout|timeout\s+occurred|timed?\s+out)/i,
		translation: "通信がタイムアウトしました",
	},
];

function translateEnglishMessage(message: string): string {
	for (const { pattern, translation } of ENGLISH_TO_JAPANESE_MESSAGES) {
		if (pattern.test(message)) return translation;
	}
	return message;
}

/**
 * 任意のエラー値からユーザーに表示するメッセージを取得する。
 *
 * 優先順位:
 * 1. `KoudenError` の場合 → `userMessage` をそのまま返す
 * 2. `Error` インスタンスの場合 → `message` を日本語に翻訳して返す
 * 3. `{ message: string }` の場合 → `message` を日本語に翻訳して返す
 * 4. 文字列の場合 → 日本語に翻訳して返す
 * 5. それ以外 → 既定メッセージ
 */
export const getErrorMessage = (error: unknown): string => {
	if (error instanceof KoudenError) {
		return error.userMessage;
	}

	let message: string;
	if (error instanceof Error) {
		message = error.message;
	} else if (error && typeof error === "object" && "message" in error) {
		message = String((error as { message: unknown }).message);
	} else if (typeof error === "string") {
		message = error;
	} else {
		return "予期せぬエラーが発生しました";
	}

	if (!message) return "予期せぬエラーが発生しました";

	return translateEnglishMessage(message);
};
