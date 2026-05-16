/**
 * 認証完了後リダイレクト先 Cookie 設定エンドポイント。
 *
 * OAuth / OTP の前にユーザーがどこに戻りたかったかを Cookie に保存し、
 * `/auth/callback` で読み出して redirect する。`document.cookie` だと
 * HttpOnly を付けられないため、サーバー側で書き込む。
 *
 * SameSite=Lax の理由は `/api/auth/cookies/invitation-token` と同じ。
 *
 * 値検証は {@link sanitizeRedirectPath} に委ねる。書き込み側と読み出し側
 * (`/auth/callback`) で同一ロジックを共有することで、ローカルに緩い Cookie
 * を仕込んで callback の信頼を悪用する経路を塞ぐ。
 */

import { sanitizeRedirectPath } from "@/lib/security/redirect";
import { NextResponse } from "next/server";

interface RequestBody {
	redirectTo?: unknown;
}

export async function POST(request: Request) {
	let body: RequestBody;
	try {
		body = (await request.json()) as RequestBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const redirectTo = body.redirectTo;
	if (typeof redirectTo !== "string") {
		return NextResponse.json({ error: "redirectTo is required" }, { status: 400 });
	}

	const safePath = sanitizeRedirectPath(redirectTo);
	if (!safePath) {
		return NextResponse.json({ error: "redirectTo is not a safe relative path" }, { status: 400 });
	}

	// Cookie 読み出し側 (/auth/callback) で `decodeURIComponent` していない素朴な
	// 文字列利用なので、ここでも生のパスをそのまま入れる。Cookie 値として禁止
	// される文字 (`;`, 空白, 制御文字) は sanitizeRedirectPath 通過後の相対パス
	// では現実的に出現しない（URL().pathname/search/hash は適切にエンコード済み）。
	const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
	const response = NextResponse.json(
		{ ok: true },
		{
			status: 200,
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
			},
		},
	);
	response.headers.set(
		"Set-Cookie",
		`post_auth_redirect=${safePath}; Path=/; HttpOnly; SameSite=Lax;${secureFlag}`,
	);
	return response;
}
