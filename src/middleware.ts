import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
	checkCSRFToken,
	createCSRFErrorResponse,
	requiresCSRFProtection,
} from "@/lib/security/csrf-protection";
import { isAllowedAdminIP, verifyBasicAuth } from "@/lib/security/ip-restrictions";
import { isAccountLocked } from "@/lib/security/login-attempts";
import { rateLimit } from "@/lib/security/rate-limiting";
import { logRateLimitExceeded, logSuspiciousActivity } from "@/lib/security/security-logger";
// 2FAチェックはMiddlewareではなくページレベルで実行（Edge Runtime制限のため）

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
