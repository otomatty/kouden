import { type NextRequest, NextResponse } from "next/server";

/**
 * 現在のリクエストのIPアドレスを返すデバッグ用API
 */
export async function GET(request: NextRequest) {
	// リクエストからクライアントIPアドレスを取得
	const getClientIP = (req: NextRequest): string | null => {
		// Vercelのヘッダーから取得
		const forwardedFor = req.headers.get("x-forwarded-for");
		if (forwardedFor) {
			return forwardedFor.split(",")[0]?.trim() || null;
		}

		// Cloudflareのヘッダーから取得
		const cfConnectingIP = req.headers.get("cf-connecting-ip");
		if (cfConnectingIP) {
			return cfConnectingIP;
		}

		// 通常のヘッダーから取得
		const xRealIP = req.headers.get("x-real-ip");
		if (xRealIP) {
			return xRealIP;
		}

		return null;
	};

	const clientIP = getClientIP(request);

	return NextResponse.json({
		ip: clientIP,
		headers: {
			"x-forwarded-for": request.headers.get("x-forwarded-for"),
			"cf-connecting-ip": request.headers.get("cf-connecting-ip"),
			"x-real-ip": request.headers.get("x-real-ip"),
		},
		timestamp: new Date().toISOString(),
	});
}
