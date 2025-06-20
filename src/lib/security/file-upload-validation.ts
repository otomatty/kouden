/**
 * ファイルアップロード制限・検証機能
 * 危険なファイルの拡張子やサイズをチェック
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { logFileUploadBlocked } from "./security-logger";

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	details?: Record<string, unknown>;
}

export interface FileUploadRestriction {
	file_extension: string;
	is_allowed: boolean;
	max_file_size?: number;
	description?: string;
}

// メモリキャッシュ（定期的に更新）
let restrictionsCache: FileUploadRestriction[] = [];
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分

/**
 * ファイルの拡張子とサイズを検証
 */
export async function validateFileUpload(
	file: File,
	userId?: string,
	request?: NextRequest,
): Promise<FileValidationResult> {
	try {
		// ファイル制限設定を取得
		const restrictions = await getFileUploadRestrictions();

		// ファイル名から拡張子を取得
		const fileName = file.name.toLowerCase();
		const extension = getFileExtension(fileName);

		if (!extension) {
			if (request) {
				await logFileUploadBlocked(userId, request, fileName, "No file extension");
			}
			return {
				isValid: false,
				error: "ファイル拡張子が無効です",
				details: { fileName, reason: "no_extension" },
			};
		}

		// 許可された拡張子かチェック
		const restriction = restrictions.find((r) => r.file_extension === extension);

		if (!restriction?.is_allowed) {
			if (request) {
				await logFileUploadBlocked(userId, request, fileName, `Forbidden extension: ${extension}`);
			}
			return {
				isValid: false,
				error: `この拡張子（${extension}）のファイルはアップロードできません`,
				details: { fileName, extension, reason: "forbidden_extension" },
			};
		}

		// ファイルサイズをチェック
		if (restriction.max_file_size && file.size > restriction.max_file_size) {
			if (request) {
				await logFileUploadBlocked(userId, request, fileName, `File too large: ${file.size} bytes`);
			}
			return {
				isValid: false,
				error: `ファイルサイズが上限（${formatFileSize(restriction.max_file_size)}）を超えています`,
				details: {
					fileName,
					fileSize: file.size,
					maxSize: restriction.max_file_size,
					reason: "file_too_large",
				},
			};
		}

		// ファイル内容の詳細検証
		const contentValidation = await validateFileContent(file, extension);
		if (!contentValidation.isValid) {
			if (request) {
				await logFileUploadBlocked(
					userId,
					request,
					fileName,
					contentValidation.error || "Content validation failed",
				);
			}
			return contentValidation;
		}

		return { isValid: true };
	} catch (error) {
		console.error("File validation error:", error);
		return {
			isValid: false,
			error: "ファイル検証中にエラーが発生しました",
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		};
	}
}

/**
 * ファイル内容の検証（バイナリレベル）
 */
async function validateFileContent(file: File, extension: string): Promise<FileValidationResult> {
	try {
		// ファイルの先頭バイトを読み取ってMIMEタイプを検証
		const buffer = await file.arrayBuffer();
		const bytes = new Uint8Array(buffer.slice(0, 20)); // 最初の20バイト

		// 魔法数字（マジックナンバー）による検証
		const detectedType = detectFileType(bytes);

		if (!isValidFileType(extension, detectedType)) {
			return {
				isValid: false,
				error: "ファイルの内容と拡張子が一致しません",
				details: {
					extension,
					detectedType,
					reason: "content_mismatch",
				},
			};
		}

		// 悪意のあるファイル内容をチェック
		const malwareCheck = await checkForMaliciousContent(buffer, extension);
		if (!malwareCheck.isValid) {
			return malwareCheck;
		}

		return { isValid: true };
	} catch (error) {
		return {
			isValid: false,
			error: "ファイル内容の検証に失敗しました",
			details: { error: error instanceof Error ? error.message : "Unknown error" },
		};
	}
}

/**
 * ファイルの魔法数字から実際のタイプを検出
 */
function detectFileType(bytes: Uint8Array): string {
	// PNG
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
		return "png";
	}

	// JPEG/JPG
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return "jpeg";
	}

	// PDF
	if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
		return "pdf";
	}

	// ZIP (docx, xlsx等も含む)
	if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
		return "zip";
	}

	// テキストファイル（UTF-8 BOM付き）
	if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
		return "text";
	}

	// 実行ファイル (PE header)
	if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
		return "executable";
	}

	return "unknown";
}

/**
 * 拡張子と実際のファイルタイプが一致するかチェック
 */
function isValidFileType(extension: string, detectedType: string): boolean {
	const validMappings: Record<string, string[]> = {
		".png": ["png"],
		".jpg": ["jpeg"],
		".jpeg": ["jpeg"],
		".pdf": ["pdf"],
		".zip": ["zip"],
		".docx": ["zip"], // Office文書はZIPベース
		".xlsx": ["zip"],
		".txt": ["text", "unknown"], // プレーンテキストは検出困難
		".csv": ["text", "unknown"],
	};

	const allowedTypes = validMappings[extension] || [];
	return allowedTypes.includes(detectedType);
}

/**
 * 悪意のあるファイル内容をチェック
 */
async function checkForMaliciousContent(
	buffer: ArrayBuffer,
	extension: string,
): Promise<FileValidationResult> {
	const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

	// スクリプトタグの検出
	const scriptPatterns = [
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		/javascript:/gi,
		/vbscript:/gi,
		/on\w+\s*=/gi, // onload, onclick等のイベントハンドラ
		/eval\s*\(/gi,
		/document\.(write|cookie)/gi,
	];

	for (const pattern of scriptPatterns) {
		if (pattern.test(content)) {
			return {
				isValid: false,
				error: "悪意のあるスクリプトが検出されました",
				details: {
					extension,
					reason: "malicious_script_detected",
					pattern: pattern.source,
				},
			};
		}
	}

	// SQLインジェクションパターンの検出
	const sqlPatterns = [
		/union\s+select/gi,
		/drop\s+table/gi,
		/insert\s+into/gi,
		/delete\s+from/gi,
		/--\s*$/gm,
		/\/\*[\s\S]*?\*\//g,
	];

	for (const pattern of sqlPatterns) {
		if (pattern.test(content)) {
			return {
				isValid: false,
				error: "SQLインジェクション攻撃の可能性があります",
				details: {
					extension,
					reason: "sql_injection_detected",
					pattern: pattern.source,
				},
			};
		}
	}

	return { isValid: true };
}

/**
 * ファイルアップロード制限設定を取得（キャッシュ付き）
 */
async function getFileUploadRestrictions(): Promise<FileUploadRestriction[]> {
	const now = Date.now();

	// キャッシュが有効な場合はキャッシュを返す
	if (restrictionsCache.length > 0 && now - cacheLastUpdated < CACHE_DURATION) {
		return restrictionsCache;
	}

	try {
		const supabase = createAdminClient();
		const { data, error } = await supabase
			.from("file_upload_restrictions")
			.select("file_extension, is_allowed, max_file_size, description");

		if (error) {
			console.error("Failed to fetch file upload restrictions:", error);
			return restrictionsCache; // フォールバック：古いキャッシュを使用
		}

		restrictionsCache =
			data?.map((item) => ({
				...item,
				max_file_size: item.max_file_size ?? undefined,
				description: item.description ?? undefined,
			})) || [];
		cacheLastUpdated = now;

		return restrictionsCache;
	} catch (error) {
		console.error("Error fetching file upload restrictions:", error);
		return restrictionsCache; // フォールバック
	}
}

/**
 * ファイル拡張子を取得
 */
function getFileExtension(fileName: string): string | null {
	const lastDotIndex = fileName.lastIndexOf(".");
	if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
		return null;
	}
	return fileName.substring(lastDotIndex);
}

/**
 * ファイルサイズを人間が読みやすい形式でフォーマット
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 管理者用: ファイル制限設定を更新
 */
export async function updateFileRestriction(
	extension: string,
	isAllowed: boolean,
	maxFileSize?: number,
	description?: string,
): Promise<void> {
	const supabase = createAdminClient();

	const { error } = await supabase.from("file_upload_restrictions").upsert({
		file_extension: extension,
		is_allowed: isAllowed,
		max_file_size: maxFileSize,
		description: description,
		updated_at: new Date().toISOString(),
	});

	if (error) {
		throw new Error(`Failed to update file restriction: ${error.message}`);
	}

	// キャッシュをクリア
	restrictionsCache = [];
	cacheLastUpdated = 0;
}
