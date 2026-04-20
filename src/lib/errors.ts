import logger from "./logger";

/**
 * エラーコードの体系化
 *
 * カテゴリー別に整理されたエラーコード定数。
 * - AUTH_*: 認証・認可エラー
 * - RESOURCE_*: リソース関連エラー
 * - VALIDATION_*: 入力値検証エラー
 * - DB_*: データベース関連エラー
 * - PAYMENT_*: 決済関連エラー
 * - UNKNOWN_ERROR: 分類不能なエラー
 */
export const ErrorCodes = {
	// 認証・認可
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
	UNKNOWN_PERMISSION: "UNKNOWN_PERMISSION",

	// リソース
	NOT_FOUND: "NOT_FOUND",
	ALREADY_EXISTS: "ALREADY_EXISTS",
	INVALID_OPERATION: "INVALID_OPERATION",

	// 入力検証
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_INPUT: "INVALID_INPUT",

	// データベース
	DB_FETCH_ERROR: "DB_FETCH_ERROR",
	DB_INSERT_ERROR: "DB_INSERT_ERROR",
	DB_UPDATE_ERROR: "DB_UPDATE_ERROR",
	DB_DELETE_ERROR: "DB_DELETE_ERROR",
	DB_CONSTRAINT_ERROR: "DB_CONSTRAINT_ERROR",
	DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",

	// 決済
	PAYMENT_ERROR: "PAYMENT_ERROR",

	// その他
	NETWORK_ERROR: "NETWORK_ERROR",
	UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes] | (string & {});

/**
 * HTTPステータスコードのデフォルトマッピング
 */
const DEFAULT_STATUS_BY_CODE: Record<string, number> = {
	[ErrorCodes.UNAUTHORIZED]: 401,
	[ErrorCodes.FORBIDDEN]: 403,
	[ErrorCodes.INSUFFICIENT_PERMISSION]: 403,
	[ErrorCodes.UNKNOWN_PERMISSION]: 403,
	[ErrorCodes.NOT_FOUND]: 404,
	[ErrorCodes.ALREADY_EXISTS]: 409,
	[ErrorCodes.INVALID_OPERATION]: 400,
	[ErrorCodes.VALIDATION_ERROR]: 400,
	[ErrorCodes.INVALID_INPUT]: 400,
	[ErrorCodes.DB_FETCH_ERROR]: 500,
	[ErrorCodes.DB_INSERT_ERROR]: 500,
	[ErrorCodes.DB_UPDATE_ERROR]: 500,
	[ErrorCodes.DB_DELETE_ERROR]: 500,
	[ErrorCodes.DB_CONSTRAINT_ERROR]: 409,
	[ErrorCodes.DB_CONNECTION_ERROR]: 503,
	[ErrorCodes.PAYMENT_ERROR]: 402,
	[ErrorCodes.NETWORK_ERROR]: 503,
	[ErrorCodes.UNKNOWN_ERROR]: 500,
};

/**
 * Supabase（PostgREST / Postgres）のエラーコードから
 * `KoudenError` の内部コードへのマッピング。
 *
 * 参照:
 * - PostgREST: https://postgrest.org/en/stable/errors.html
 * - Postgres : https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const SUPABASE_ERROR_CODE_MAP: Record<string, { code: string; message: string }> = {
	// PostgREST
	PGRST116: {
		code: ErrorCodes.NOT_FOUND,
		message: "対象のデータが見つかりませんでした。",
	},
	PGRST301: { code: ErrorCodes.UNAUTHORIZED, message: "認証が必要です。" },

	// Postgres
	"23505": {
		code: ErrorCodes.ALREADY_EXISTS,
		message: "すでに同じデータが存在します。",
	},
	"23503": {
		code: ErrorCodes.DB_CONSTRAINT_ERROR,
		message: "関連するデータが存在するため処理できませんでした。",
	},
	"23502": {
		code: ErrorCodes.VALIDATION_ERROR,
		message: "必須項目が入力されていません。",
	},
	"23514": {
		code: ErrorCodes.VALIDATION_ERROR,
		message: "入力値が制約を満たしていません。",
	},
	"42501": {
		code: ErrorCodes.FORBIDDEN,
		message: "この操作を行う権限がありません。",
	},
	"42P01": {
		code: ErrorCodes.DB_FETCH_ERROR,
		message: "データの取得に失敗しました。",
	},
};

/**
 * エラーコードから既定の日本語メッセージを生成する
 */
const DEFAULT_USER_MESSAGE_BY_CODE: Record<string, string> = {
	[ErrorCodes.UNAUTHORIZED]: "認証が必要です。ログインしてください。",
	[ErrorCodes.FORBIDDEN]: "この操作を行う権限がありません。",
	[ErrorCodes.INSUFFICIENT_PERMISSION]: "この操作を行う権限がありません。",
	[ErrorCodes.UNKNOWN_PERMISSION]: "権限を判定できませんでした。",
	[ErrorCodes.NOT_FOUND]: "対象のデータが見つかりませんでした。",
	[ErrorCodes.ALREADY_EXISTS]: "すでに同じデータが存在します。",
	[ErrorCodes.INVALID_OPERATION]: "この操作は実行できません。",
	[ErrorCodes.VALIDATION_ERROR]: "入力内容に誤りがあります。",
	[ErrorCodes.INVALID_INPUT]: "入力内容に誤りがあります。",
	[ErrorCodes.DB_FETCH_ERROR]: "データの取得に失敗しました。",
	[ErrorCodes.DB_INSERT_ERROR]: "データの登録に失敗しました。",
	[ErrorCodes.DB_UPDATE_ERROR]: "データの更新に失敗しました。",
	[ErrorCodes.DB_DELETE_ERROR]: "データの削除に失敗しました。",
	[ErrorCodes.DB_CONSTRAINT_ERROR]: "関連するデータが存在するため処理できませんでした。",
	[ErrorCodes.DB_CONNECTION_ERROR]: "データベースに接続できませんでした。",
	[ErrorCodes.PAYMENT_ERROR]: "決済処理に失敗しました。",
	[ErrorCodes.NETWORK_ERROR]: "通信エラーが発生しました。時間をおいて再度お試しください。",
	[ErrorCodes.UNKNOWN_ERROR]: "予期せぬエラーが発生しました。",
};

/**
 * Supabase由来のエラーオブジェクトかどうかを判定する
 */
interface SupabaseLikeError {
	code?: string;
	message?: string;
	details?: string | null;
	hint?: string | null;
}

function isSupabaseLikeError(error: unknown): error is SupabaseLikeError {
	if (!error || typeof error !== "object") return false;
	const e = error as Record<string, unknown>;
	// Supabaseのエラー（PostgrestError / PostgREST / Postgres）は
	// いずれも `code` と `message` を持つ。
	// PostgrestError は Error を継承しているため、Errorインスタンスも除外しない。
	// `code` だけ持つ任意オブジェクトを誤検出しないよう `message` の存在も要求する。
	return typeof e.code === "string" && typeof e.message === "string";
}

/**
 * Supabase エラーコードを `KoudenError` の分類にマッピングする。
 *
 * 一部のエラーコード（`PGRST116` 等）は状況によって意味が変わるため、
 * `details` や `message` の内容から推定して分岐する。
 */
function resolveSupabaseMapping(
	error: SupabaseLikeError,
): { code: string; message: string } | undefined {
	const code = error.code;
	if (!code) return undefined;

	// PGRST116 は「想定外の行数」で発火する。
	// 0 行 → NOT_FOUND、それ以外（複数行） → データ整合性エラーとして DB_FETCH_ERROR に倒す。
	if (code === "PGRST116") {
		const details = typeof error.details === "string" ? error.details : "";
		const message = typeof error.message === "string" ? error.message : "";
		const combined = `${details} ${message}`.toLowerCase();
		const isZeroRows = /\b0\s+rows?\b/.test(combined) || /no\s+rows/.test(combined);
		if (isZeroRows) {
			return {
				code: ErrorCodes.NOT_FOUND,
				message: "対象のデータが見つかりませんでした。",
			};
		}
		return {
			code: ErrorCodes.DB_FETCH_ERROR,
			message: "データの取得結果が想定と一致しませんでした。",
		};
	}

	return SUPABASE_ERROR_CODE_MAP[code];
}

export interface KoudenErrorOptions {
	/** HTTPステータスコード（未指定時はコードから自動決定） */
	status?: number;
	/** エンドユーザーに見せるメッセージ。未指定時はエラーコードから自動生成 */
	userMessage?: string;
	/** 詳細情報（ログ用） */
	details?: Record<string, unknown>;
	/** 元のエラー（ラップ時に原因を保持） */
	cause?: unknown;
}

/**
 * 本アプリケーション独自のエラークラス。
 *
 * - `code`: エラーコード（機械可読）
 * - `message`: 開発者向けメッセージ
 * - `userMessage`: エンドユーザー向け日本語メッセージ
 * - `status`: 対応するHTTPステータス
 */
export class KoudenError extends Error {
	public readonly code: string;
	public readonly status: number;
	public readonly userMessage: string;
	public readonly details?: Record<string, unknown>;

	constructor(
		message: string,
		code: string = ErrorCodes.UNKNOWN_ERROR,
		options: KoudenErrorOptions | number = {},
	) {
		super(message);
		this.name = "KoudenError";
		this.code = code;

		const opts: KoudenErrorOptions = typeof options === "number" ? { status: options } : options;
		this.status = opts.status ?? DEFAULT_STATUS_BY_CODE[code] ?? 500;
		this.userMessage = opts.userMessage ?? DEFAULT_USER_MESSAGE_BY_CODE[code] ?? message;
		this.details = opts.details;

		if (opts.cause !== undefined) {
			(this as Error & { cause?: unknown }).cause = opts.cause;
		}
	}

	/**
	 * Supabase（PostgREST/Postgres）由来のエラーを `KoudenError` に変換する。
	 *
	 * @param error Supabaseから返されたエラー
	 * @param context 失敗した操作の説明（「メンバー一覧の取得」など）
	 */
	static fromSupabase(error: unknown, context: string): KoudenError {
		if (error instanceof KoudenError) return error;

		if (isSupabaseLikeError(error)) {
			const mapped = resolveSupabaseMapping(error);
			const code = mapped?.code ?? ErrorCodes.DB_FETCH_ERROR;
			const userMessage = mapped?.message ?? `${context}に失敗しました。`;
			return new KoudenError(error.message ?? `${context} failed`, code, {
				userMessage,
				details: {
					supabaseCode: error.code,
					supabaseDetails: error.details,
					supabaseHint: error.hint,
				},
				cause: error,
			});
		}

		return KoudenError.from(error, context);
	}

	/**
	 * 任意のthrowされた値を `KoudenError` に変換する。
	 */
	static from(error: unknown, context: string): KoudenError {
		if (error instanceof KoudenError) return error;

		if (error instanceof Error) {
			return new KoudenError(error.message || `${context} failed`, ErrorCodes.UNKNOWN_ERROR, {
				userMessage: `${context}に失敗しました。`,
				cause: error,
			});
		}

		return new KoudenError(
			typeof error === "string" ? error : `${context} failed`,
			ErrorCodes.UNKNOWN_ERROR,
			{
				userMessage: `${context}に失敗しました。`,
				cause: error,
			},
		);
	}
}

/**
 * Server Action等で利用する統一レスポンス型。
 *
 * `ok: true` の成功ケースと、`ok: false` の失敗ケースを判別可能ユニオンとして表現する。
 *
 * ※ `details` はサーバー内部情報（DBの制約名・テーブル名等）を含む恐れがあるため、
 *   クライアントに返却するこの型からは意図的に除外している。
 *   サーバーサイドでは `KoudenError.details` を直接参照すればよい。
 */
export type ActionResult<T> =
	| { ok: true; data: T }
	| {
			ok: false;
			error: {
				code: string;
				message: string;
				status: number;
			};
	  };

/**
 * `KoudenError`（または任意のエラー）を `ActionResult` のエラー形式に変換する。
 *
 * `details` は内部情報の漏洩を避けるためクライアントには返さない。
 */
export function toActionError<T = never>(error: unknown, context: string): ActionResult<T> {
	const kErr = error instanceof KoudenError ? error : KoudenError.from(error, context);
	return {
		ok: false,
		error: {
			code: kErr.code,
			message: kErr.userMessage,
			status: kErr.status,
		},
	};
}

/**
 * `KoudenError` を構造化ログとして出力する内部ヘルパー。
 */
function logKoudenError(err: KoudenError, errorContext: string): void {
	logger.error(
		{
			errorContext,
			error: err.message,
			errorCode: err.code,
			errorStatus: err.status,
			errorStack: err.stack,
			errorDetails: err.details,
		},
		`[ERROR] ${errorContext}`,
	);
}

/**
 * 統一的なエラーハンドリングを提供するユーティリティ関数。
 *
 * - 失敗時は必ず `KoudenError` を投げる（非 `KoudenError` は変換）
 * - 構造化ログを自動で出力する
 * - Supabaseエラーは自動で変換する
 */
export const withErrorHandling = async <T>(
	action: () => Promise<T>,
	errorContext: string,
): Promise<T> => {
	try {
		return await action();
	} catch (error) {
		const koudenError = KoudenError.fromSupabase(error, errorContext);
		logKoudenError(koudenError, errorContext);
		throw koudenError;
	}
};

/**
 * `withErrorHandling` の結果型バリアント。
 *
 * 例外をthrowせず、成功/失敗をオブジェクトで返すので、
 * Server Actionからクライアントに渡しやすい。
 */
export const withActionResult = async <T>(
	action: () => Promise<T>,
	errorContext: string,
): Promise<ActionResult<T>> => {
	try {
		const data = await action();
		return { ok: true, data };
	} catch (error) {
		const koudenError = KoudenError.fromSupabase(error, errorContext);
		logKoudenError(koudenError, errorContext);
		return toActionError<T>(koudenError, errorContext);
	}
};
