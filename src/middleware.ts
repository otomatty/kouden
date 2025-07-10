import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAllowedAdminIP, verifyBasicAuth } from "@/lib/security/ip-restrictions";
import { isAccountLocked } from "@/lib/security/login-attempts";
import { rateLimit } from "@/lib/security/rate-limiting";
// Web Crypto APIを使用（node:cryptoをEdge Runtimeで使用すると問題が起こる場合がある）
import { logRateLimitExceeded, logSuspiciousActivity } from "@/lib/security/security-logger";
// 2FAチェックはMiddlewareではなくページレベルで実行（Edge Runtime制限のため）

const CSRF_SECRET = process.env.CSRF_SECRET || "default-secret-change-in-production";

/**
 * Web Crypto APIを使ってSHA-256ハッシュを生成
 */
async function createSha256Hash(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRFトークンを検証（middleware専用）
 */
async function verifyCSRFToken(token: string): Promise<boolean> {
	try {
		const [tokenPart, timestamp, signature] = token.split(":");

		if (!(tokenPart && timestamp && signature)) {
			return false;
		}

		// タイムスタンプチェック（1時間以内）
		const tokenTime = Number.parseInt(timestamp);
		const now = Date.now();
		if (now - tokenTime > 3600000) {
			// 1時間
			return false;
		}

		// 署名検証
		const expectedSignature = await createSha256Hash(`${tokenPart}:${timestamp}:${CSRF_SECRET}`);

		return signature === expectedSignature;
	} catch {
		return false;
	}
}

/**
 * リクエストのCSRFトークンをチェック（middleware専用）
 */
async function checkCSRFToken(request: NextRequest): Promise<boolean> {
	// GETリクエストはスキップ
	if (request.method === "GET") {
		return true;
	}

	// 開発環境では緩和（デバッグ用）
	if (process.env.NODE_ENV === "development" && process.env.CSRF_DEBUG === "true") {
		console.warn("CSRF protection is disabled in development mode");
		return true;
	}

	// CSRFトークンを取得（ヘッダーまたはCookieから）
	const csrfToken = request.headers.get("x-csrf-token") || request.cookies.get("csrf-token")?.value;

	if (!csrfToken) {
		console.warn("CSRF token is missing");
		return false;
	}

	const isValid = await verifyCSRFToken(csrfToken);
	if (!isValid) {
		console.warn("CSRF token validation failed");
	}

	return isValid;
}

/**
 * CSRF保護が必要なパスかどうかを判定（middleware専用）
 */
function requiresCSRFProtection(pathname: string): boolean {
	// API routes
	if (pathname.startsWith("/api/")) {
		// CSRF保護が不要なAPI（webhook等）
		const exemptPaths = ["/api/stripe/webhook", "/api/health", "/api/csrf-token"];
		return !exemptPaths.some((path) => pathname.startsWith(path));
	}

	// Server Actions は Next.js が自動でCSRF保護するため除外
	// (実際のServer ActionsのパスはNext.jsが内部的に処理)
	return false;
}

/**
 * CSRFエラーレスポンス（middleware専用）
 */
function createCSRFErrorResponse(): Response {
	return new Response("CSRF token validation failed", {
		status: 403,
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

export async function middleware(request: NextRequest) {
	const supabase = await createClient();

	// レート制限チェック
	const rateLimitResult = await rateLimit(request);
	if (!rateLimitResult.success) {
		// レート制限超過をログ
		await logRateLimitExceeded(request, request.nextUrl.pathname);
		return new NextResponse("Too Many Requests", {
			status: 429,
			headers: {
				"Retry-After": "60",
			},
		});
	}

	// CSRF保護チェック
	if (requiresCSRFProtection(request.nextUrl.pathname)) {
		if (!(await checkCSRFToken(request))) {
			// CSRF攻撃の可能性をログ
			await logSuspiciousActivity(
				undefined, // ユーザーIDは後で取得
				request,
				"csrf_token_validation_failed",
				{
					path: request.nextUrl.pathname,
					method: request.method,
					referer: request.headers.get("referer"),
				},
			);
			return createCSRFErrorResponse();
		}
	}

	// 管理者画面へのアクセス制限
	if (
		request.nextUrl.pathname.startsWith("/admin") ||
		request.nextUrl.pathname.startsWith("/(system)/admin")
	) {
		// IP制限チェック
		if (!isAllowedAdminIP(request)) {
			// IP制限に引っかかった場合はベーシック認証を要求
			const authHeader = request.headers.get("authorization");
			
			// Authorizationヘッダーがない場合（認証をキャンセルした場合）は香典帳アプリトップへリダイレクト
			if (!authHeader) {
				return NextResponse.redirect(new URL("/koudens", request.url));
			}
			
			// 認証ヘッダーはあるが認証に失敗した場合は401を返す
			if (!verifyBasicAuth(request)) {
				return new NextResponse("Unauthorized", {
					status: 401,
					headers: {
						"WWW-Authenticate": 'Basic realm="Admin Area"',
					},
				});
			}
		}

		// アカウントロックチェック
		const lockStatus = await isAccountLocked(request);
		if (lockStatus.locked) {
			return new NextResponse(`Account locked. Try again in ${lockStatus.remainingTime} minutes.`, {
				status: 423,
			});
		}

		// 2FA必須チェックはページレベルで実行
		// Edge Runtimeでspeakeasyライブラリが動作しないため、
		// middlewareでは基本的なIP/レート制限のみ実施
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 保護されたルートへのアクセス時に認証チェック
	if (
		request.nextUrl.pathname.startsWith("/(protected)") ||
		request.nextUrl.pathname.startsWith("/koudens")
	) {
		if (!user) {
			return NextResponse.redirect(new URL("/auth/login", request.url));
		}
	}

	// ログイン済みユーザーがログインページにアクセスした場合はリダイレクト
	if (request.nextUrl.pathname.startsWith("/auth/login") && user) {
		return NextResponse.redirect(new URL("/koudens", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
