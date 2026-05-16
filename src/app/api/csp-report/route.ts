/**
 * Content-Security-Policy 違反レポート受信エンドポイント。
 *
 * `next.config.ts` の `Content-Security-Policy-Report-Only` ヘッダーで
 * `report-uri /api/csp-report` および `report-to csp` を指定しているため、
 * ブラウザは違反検知時にこのパスへ POST を送る。
 *
 * - レガシー `report-uri`: `application/csp-report`
 *   (単一オブジェクト、ダッシュ区切りキー `document-uri` 等)
 * - 新方式 Reporting API: `application/reports+json`
 *   (配列、キャメルケースキー `documentURL` 等)
 *
 * どちらの形式でも受け取り、構造化ログとして記録する。Report-Only での
 * チューニング中に誤検知を洗い出し、enforce 化に備えるための窓口。
 */

import logger from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 受け付けるリクエストボディの上限。CSP レポートは通常 1-2KB 程度で、
// 余裕を見ても 64KB あれば十分。これを超えた POST は早期に弾く。
const MAX_CSP_REPORT_BYTES = 64 * 1024;

// 1 リクエスト内で処理するエントリ数の上限。Reporting API は配列形式で
// 来る可能性があり、巨大配列によるログ増幅を防ぐ。
const MAX_REPORT_ENTRIES = 10;

const ALLOWED_CONTENT_TYPES = [
	"application/csp-report",
	"application/reports+json",
	"application/json",
];

interface NormalizedReport {
	documentUri?: string;
	violatedDirective?: string;
	blockedUri?: string;
	sourceFile?: string;
	lineNumber?: number;
	columnNumber?: number;
	disposition?: string;
	referrer?: string;
}

interface ReportToBody {
	type?: string;
	url?: string;
	body?: Record<string, unknown>;
}

/**
 * URL らしき文字列から `origin + pathname` だけを残す。
 * クエリ文字列やフラグメントに含まれるトークン / PII を
 * ログへ落とさないためのサニタイズ。
 */
function sanitizeUrl(value: unknown): string | undefined {
	if (typeof value !== "string" || value.length === 0) return undefined;
	try {
		const url = new URL(value);
		return `${url.origin}${url.pathname}`;
	} catch {
		// 相対 URL や `inline` / `eval` など非 URL 文字列は先頭だけ残す。
		return value.slice(0, 200);
	}
}

function pickString(report: Record<string, unknown>, ...keys: string[]): string | undefined {
	for (const key of keys) {
		const v = report[key];
		if (typeof v === "string" && v.length > 0) return v;
	}
	return undefined;
}

function pickNumber(report: Record<string, unknown>, ...keys: string[]): number | undefined {
	for (const key of keys) {
		const v = report[key];
		if (typeof v === "number") return v;
	}
	return undefined;
}

/**
 * レガシー (dashed) / モダン (camelCase) 両形式のキーを吸収して
 * 共通のログ形式に正規化する。
 */
function normalize(report: Record<string, unknown>): NormalizedReport {
	return {
		documentUri: sanitizeUrl(pickString(report, "document-uri", "documentURL")),
		violatedDirective: pickString(
			report,
			"violated-directive",
			"effective-directive",
			"effectiveDirective",
		),
		blockedUri: sanitizeUrl(pickString(report, "blocked-uri", "blockedURL")),
		sourceFile: sanitizeUrl(pickString(report, "source-file", "sourceFile")),
		lineNumber: pickNumber(report, "line-number", "lineNumber"),
		columnNumber: pickNumber(report, "column-number", "columnNumber"),
		disposition: pickString(report, "disposition"),
		referrer: sanitizeUrl(pickString(report, "referrer")),
	};
}

function logViolation(report: Record<string, unknown>, request: NextRequest): void {
	logger.warn(
		{
			...normalize(report),
			userAgent: request.headers.get("user-agent"),
		},
		"CSP violation reported",
	);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
	if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
		return new NextResponse(null, { status: 204 });
	}

	const declaredLength = Number(request.headers.get("content-length") ?? "0");
	if (Number.isFinite(declaredLength) && declaredLength > MAX_CSP_REPORT_BYTES) {
		logger.warn({ declaredLength }, "CSP report payload too large (Content-Length)");
		return new NextResponse(null, { status: 204 });
	}

	try {
		const raw = await request.text();
		if (!raw) {
			return new NextResponse(null, { status: 204 });
		}
		if (raw.length > MAX_CSP_REPORT_BYTES) {
			logger.warn({ size: raw.length }, "CSP report payload too large");
			return new NextResponse(null, { status: 204 });
		}

		const parsed: unknown = JSON.parse(raw);

		if (Array.isArray(parsed)) {
			// 新方式 Reporting API: `application/reports+json` の配列形式
			const entries = (parsed as ReportToBody[]).slice(0, MAX_REPORT_ENTRIES);
			for (const entry of entries) {
				if (entry?.type === "csp-violation" && entry.body) {
					logViolation(entry.body, request);
				}
			}
		} else if (parsed && typeof parsed === "object") {
			const obj = parsed as {
				"csp-report"?: Record<string, unknown>;
				body?: Record<string, unknown>;
			};
			if (obj["csp-report"]) {
				// レガシー `report-uri`: `application/csp-report`
				logViolation(obj["csp-report"], request);
			} else if (obj.body) {
				// 単発の Reporting API オブジェクト
				logViolation(obj.body, request);
			}
		}
	} catch (error) {
		// 不正な JSON を送ってきたクライアントでも 5xx は返さない (ブラウザがリトライしないため)。
		logger.warn({ err: error }, "Failed to parse CSP report payload");
	}

	return new NextResponse(null, { status: 204 });
}
