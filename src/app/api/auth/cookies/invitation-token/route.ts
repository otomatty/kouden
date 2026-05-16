/**
 * 招待トークン Cookie 設定エンドポイント。
 *
 * 認証フロー（特に OAuth リダイレクト）の前にトークン値を Cookie に格納する
 * 必要があるが、`document.cookie` での書き込みでは `HttpOnly` を付けられず
 * XSS から保護できない。サーバー側で書き込むことで `HttpOnly; Secure;
 * SameSite=Lax` を強制する。
 *
 * SameSite=Lax の理由:
 *   Google → Supabase → /auth/callback の最終リダイレクトは cross-site の
 *   top-level GET になる。SameSite=Strict だとこのとき Cookie が落ちるため、
 *   Strict ではフローが破綻する。XSS 緩和の本命は HttpOnly。
 *
 * CSRF: middleware の `requiresCSRFProtection` でカバーされており、本ルート
 *   は除外リストに入っていないため、クライアントは `X-CSRF-Token` ヘッダー
 *   と `csrf-token` Cookie の両方を持参する必要がある。
 */

import logger from "@/lib/logger";
import { NextResponse } from "next/server";

const INVITATION_TOKEN_MAX_LENGTH = 256;
// 招待トークンの値域。現状は UUID 想定だが将来 base64url 系に拡張しても
// 通すよう緩めにしてある。コロン・スラッシュ・改行など Cookie 注入に
// 使われうる文字を確実に排除するのが目的。
const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9._~-]+$/;

interface RequestBody {
	token?: unknown;
}

export async function POST(request: Request) {
	let body: RequestBody;
	try {
		body = (await request.json()) as RequestBody;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const token = body.token;
	if (typeof token !== "string" || token.length === 0) {
		return NextResponse.json({ error: "token is required" }, { status: 400 });
	}
	if (token.length > INVITATION_TOKEN_MAX_LENGTH) {
		return NextResponse.json({ error: "token is too long" }, { status: 400 });
	}
	if (!INVITATION_TOKEN_PATTERN.test(token)) {
		logger.warn(
			{ tokenLength: token.length },
			"Rejected invitation_token cookie write (bad chars)",
		);
		return NextResponse.json({ error: "token contains invalid characters" }, { status: 400 });
	}

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
		`invitation_token=${token}; Path=/; HttpOnly; SameSite=Lax;${secureFlag} Max-Age=3600`,
	);
	return response;
}
