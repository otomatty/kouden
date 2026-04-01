/**
 * ログ管理システム
 * pinoを使用した構造化ログの実装
 * サーバー側とクライアント側の両方に対応
 */

import pino from "pino";

// ログレベルの型定義
export type LogLevel = "debug" | "info" | "warn" | "error";

// 環境変数からログレベルを取得（デフォルト: development=debug, production=info）
function getLogLevel(): LogLevel {
	const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
	if (envLevel && ["debug", "info", "warn", "error"].includes(envLevel)) {
		return envLevel;
	}

	// NODE_ENVに基づくデフォルト設定
	if (process.env.NODE_ENV === "production") {
		return "info";
	}
	return "debug";
}

// サーバー側ロガーの作成
function createServerLogger(): pino.Logger {
	const isDevelopment = process.env.NODE_ENV === "development";
	const level = getLogLevel();

	const logger = pino({
		level,
		transport: isDevelopment
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				}
			: undefined,
	});

	return logger;
}

// ブラウザ環境用のロガーインターフェース
interface BrowserLogger {
	debug: (obj: Record<string, unknown>, msg?: string) => void;
	info: (obj: Record<string, unknown>, msg?: string) => void;
	warn: (obj: Record<string, unknown>, msg?: string) => void;
	error: (obj: Record<string, unknown>, msg?: string) => void;
}

// ブラウザ環境用のロガー実装（console.logベース）
function createBrowserLogger(): BrowserLogger {
	const level = getLogLevel();
	const levelPriority: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	const currentPriority = levelPriority[level];

	const shouldLog = (targetLevel: LogLevel): boolean => {
		return levelPriority[targetLevel] >= currentPriority;
	};

	return {
		debug: (obj: Record<string, unknown>, msg?: string) => {
			if (shouldLog("debug")) {
				console.debug(msg || "", obj);
			}
		},
		info: (obj: Record<string, unknown>, msg?: string) => {
			if (shouldLog("info")) {
				console.info(msg || "", obj);
			}
		},
		warn: (obj: Record<string, unknown>, msg?: string) => {
			if (shouldLog("warn")) {
				console.warn(msg || "", obj);
			}
		},
		error: (obj: Record<string, unknown>, msg?: string) => {
			if (shouldLog("error")) {
				console.error(msg || "", obj);
			}
		},
	};
}

// 環境判定（サーバー側かブラウザ側か）
const isServer = typeof window === "undefined";

// ロガーインスタンス（シングルトンパターン）
let loggerInstance: pino.Logger | BrowserLogger | null = null;

/**
 * ロガーインスタンスを取得
 * サーバー側ではpino、ブラウザ側ではconsole.logベースのロガーを返す
 */
export function getLogger(): pino.Logger | BrowserLogger {
	if (loggerInstance === null) {
		if (isServer) {
			loggerInstance = createServerLogger();
		} else {
			loggerInstance = createBrowserLogger();
		}
	}
	return loggerInstance;
}

// デフォルトエクスポート（推奨）
const logger = getLogger();

export default logger;

// 便利な関数エクスポート
export const log = {
	debug: (obj: Record<string, unknown>, msg?: string) => {
		if (isServer) {
			(logger as pino.Logger).debug(obj, msg);
		} else {
			(logger as BrowserLogger).debug(obj, msg);
		}
	},
	info: (obj: Record<string, unknown>, msg?: string) => {
		if (isServer) {
			(logger as pino.Logger).info(obj, msg);
		} else {
			(logger as BrowserLogger).info(obj, msg);
		}
	},
	warn: (obj: Record<string, unknown>, msg?: string) => {
		if (isServer) {
			(logger as pino.Logger).warn(obj, msg);
		} else {
			(logger as BrowserLogger).warn(obj, msg);
		}
	},
	error: (obj: Record<string, unknown>, msg?: string) => {
		if (isServer) {
			(logger as pino.Logger).error(obj, msg);
		} else {
			(logger as BrowserLogger).error(obj, msg);
		}
	},
};
