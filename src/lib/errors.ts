// カスタムエラークラスの定義
export class KoudenError extends Error {
	constructor(
		message: string,
		public code: string,
		public status = 400,
	) {
		super(message);
		this.name = "KoudenError";
	}
}

// エラーハンドリングのユーティリティ関数
export const withErrorHandling = async <T>(
	action: () => Promise<T>,
	errorContext: string,
): Promise<T> => {
	try {
		return await action();
	} catch (error) {
		console.error(`[ERROR] ${errorContext}:`, error);
		if (error instanceof KoudenError) {
			throw error;
		}
		throw new KoudenError(`${errorContext}に失敗しました`, "UNKNOWN_ERROR");
	}
};
