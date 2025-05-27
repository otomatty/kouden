import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	const supabase = await createClient();

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
