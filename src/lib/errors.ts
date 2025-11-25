import logger from "./logger";

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
		logger.error(
			{
				errorContext,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined,
				errorCode: error instanceof KoudenError ? error.code : undefined,
			},
			`[ERROR] ${errorContext}`,
		);
		if (error instanceof KoudenError) {
			throw error;
		}
		throw new KoudenError(`${errorContext}に失敗しました`, "UNKNOWN_ERROR");
	}
};
