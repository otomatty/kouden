/**
 * Content-Security-Policy 違反レポート受信エンドポイント。
 *
 * `next.config.ts` の `Content-Security-Policy-Report-Only` ヘッダーで
 * `report-uri /api/csp-report` を指定しているため、ブラウザは違反検知時に
 * このパスへ POST を送る。
 *
 * - レガシー `report-uri`: `application/csp-report` (単一の `csp-report` オブジェクト)
 * - 新方式 `report-to` / Reporting API: `application/reports+json` (配列)
 *
 * どちらの形式でも受け取り、構造化ログとして記録する。Report-Only での
 * チューニング中に誤検知を洗い出し、enforce 化に備えるための窓口。
 */

import logger from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface CspReportPayload {
	"document-uri"?: string;
	"violated-directive"?: string;
	"effective-directive"?: string;
	"blocked-uri"?: string;
	"original-policy"?: string;
	"source-file"?: string;
	"line-number"?: number;
	"column-number"?: number;
	disposition?: string;
	referrer?: string;
	[key: string]: unknown;
}

interface ReportToBody {
	type?: string;
	url?: string;
	body?: CspReportPayload;
	[key: string]: unknown;
}

function logViolation(report: CspReportPayload, request: NextRequest): void {
	logger.warn(
		{
			documentUri: report["document-uri"],
			violatedDirective: report["violated-directive"] ?? report["effective-directive"],
			blockedUri: report["blocked-uri"],
			sourceFile: report["source-file"],
			lineNumber: report["line-number"],
			columnNumber: report["column-number"],
			disposition: report.disposition,
			referrer: report.referrer,
			userAgent: request.headers.get("user-agent"),
		},
		"CSP violation reported",
	);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const raw = await request.text();
		if (!raw) {
			return new NextResponse(null, { status: 204 });
		}

		const parsed: unknown = JSON.parse(raw);

		if (Array.isArray(parsed)) {
			// 新方式 Reporting API: `application/reports+json` の配列形式
			for (const entry of parsed as ReportToBody[]) {
				if (entry?.type === "csp-violation" && entry.body) {
					logViolation(entry.body, request);
				}
			}
		} else if (parsed && typeof parsed === "object") {
			const obj = parsed as { "csp-report"?: CspReportPayload; body?: CspReportPayload };
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
