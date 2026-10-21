/**
 * CSRFトークン配布API
 * フロントエンドからCSRFトークンを取得するためのエンドポイント
 */

import {
	CSRF_TOKEN_TTL_MS,
	generateCSRFToken,
	getCSRFTokenRemainingTTL,
	verifyCSRFToken,
} from "@/lib/security/csrf-protection";
import type { NextRequest } from "next/server";
import logger from "@/lib/logger";

// 残存TTLがこの値未満の既存トークンは再利用せず、新規生成する。
// 取得直後のフォーム送信が短時間で失効するのを防ぐため。
const REUSE_MIN_REMAINING_MS = 5 * 60 * 1000;

/**
 * CSRFトークン配布エンドポイント。
 *
 * - 受信した `csrf-token` Cookie が署名・タイムスタンプともに有効、かつ
 *   残存TTLが {@link REUSE_MIN_REMAINING_MS} を上回るときは、それを再利用する
 *   （複数タブ間でトークンを安定化させる）。
 * - それ以外（欠落・改ざん・期限切れ・残り少）は新規発行する。
 * - レスポンスは JSON ボディの `csrfToken` と、同値の `Set-Cookie`
 *   (`HttpOnly` / `SameSite=Strict` / 本番のみ `Secure`) で返す。
 * - Cookie の `Max-Age` はトークン署名の残存TTLと一致させ、Cookieが
 *   トークン本体より長生きしないようにする（残存超過時の 403 を防止）。
 *
 * @param request 受信リクエスト（Cookie の再利用判定に使用）
 * @returns 200 with JSON body & Set-Cookie ／ 失敗時 500
 */
export async function GET(request: NextRequest) {
	try {
		const existingToken = request.cookies.get("csrf-token")?.value;

		let token: string;
		let cookieMaxAgeSec: number;

		if (existingToken && (await verifyCSRFToken(existingToken))) {
			const remainingMs = getCSRFTokenRemainingTTL(existingToken);
			if (remainingMs !== null && remainingMs > REUSE_MIN_REMAINING_MS) {
				token = existingToken;
				cookieMaxAgeSec = Math.floor(remainingMs / 1000);
			} else {
				token = await generateCSRFToken();
				cookieMaxAgeSec = Math.floor(CSRF_TOKEN_TTL_MS / 1000);
			}
		} else {
			token = await generateCSRFToken();
			cookieMaxAgeSec = Math.floor(CSRF_TOKEN_TTL_MS / 1000);
		}

		// JSONレスポンス: クライアントはここからトークンを取得し、X-CSRF-Token ヘッダーで送信する。
		// Cache-Control: no-store でブラウザ・中間キャッシュからのトークン再利用を防止。
		const response = new Response(
			JSON.stringify({
				csrfToken: token,
				message: "CSRF token generated successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		);

		// CSRFトークンをCookieに設定（Double-submit Cookieパターンで使用）
		// HttpOnly: JSからの読み取り防止。クライアントはJSONレスポンスから取得済み。
		// Max-Age: トークン署名の残存TTLに揃え、Cookieがトークンより長生きしないようにする。
		const secureFlag = process.env.NODE_ENV === "production" ? " Secure;" : "";
		response.headers.set(
			"Set-Cookie",
			`csrf-token=${token}; Path=/; HttpOnly; SameSite=Strict;${secureFlag} Max-Age=${cookieMaxAgeSec}`,
		);

		return response;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Error generating CSRF token",
		);
		return new Response("Internal Server Error", { status: 500 });
	}
}
