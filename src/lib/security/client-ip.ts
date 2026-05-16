/**
 * クライアントIP取得ユーティリティ
 *
 * `x-forwarded-for` の左端を採用するとクライアントが自由に詐称できるため、
 * 信頼できるプロキシ越しのトポロジ前提で右端から信頼 hop 数分遡って採用する。
 *
 * 優先順位 (CDN 固有ヘッダは「実際にその環境にいる」と判定できる場合のみ採用):
 * 1. `x-vercel-forwarded-for` (`process.env.VERCEL` または `TRUSTED_PROXY_PROVIDER=vercel`)
 * 2. `cf-connecting-ip` (`TRUSTED_PROXY_PROVIDER=cloudflare` の場合のみ)
 * 3. `x-forwarded-for` を `TRUSTED_PROXY_HOPS` で評価
 * 4. `x-real-ip` (単一プロキシ環境のフォールバック)
 */

import type { NextRequest } from "next/server";

interface ReadonlyHeadersLike {
	get(name: string): string | null;
}

type RequestLike = NextRequest | { headers: ReadonlyHeadersLike };

function readTrustedProxyHops(): number {
	const raw = process.env.TRUSTED_PROXY_HOPS;
	if (!raw) return 1;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed < 1) return 1;
	return parsed;
}

const IPV4_REGEX =
	/^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_SEGMENT_REGEX = /^[0-9a-fA-F]{1,4}$/;

function normalizeIPCandidate(raw: string): string | null {
	let candidate = raw.trim();
	if (!candidate) return null;

	// Strip RFC 7239 style surrounding quotes
	if (candidate.startsWith('"') && candidate.endsWith('"')) {
		candidate = candidate.slice(1, -1).trim();
	}

	// Strip IPv6 zone id (e.g. fe80::1%eth0)
	const zoneIndex = candidate.indexOf("%");
	if (zoneIndex !== -1) {
		candidate = candidate.slice(0, zoneIndex);
	}

	// Handle bracketed IPv6 with optional port: [::1]:8080
	if (candidate.startsWith("[")) {
		const closing = candidate.indexOf("]");
		if (closing === -1) return null;
		candidate = candidate.slice(1, closing);
	} else if (
		// IPv4 with port (e.g. 1.2.3.4:5678) — strip only when single colon and IPv4-shaped
		candidate.includes(":") &&
		candidate.split(":").length === 2 &&
		candidate.split(":")[0]?.includes(".")
	) {
		candidate = candidate.split(":")[0] ?? candidate;
	}

	return candidate || null;
}

/**
 * IPv6 を緩いコロン列だけで通すと `::::` や `2001:::1` のような不正形式が
 * 素通りしてしまうため、`::` の出現回数と各セグメントを個別に検証する。
 */
function isValidIPv6(value: string): boolean {
	if (value.length === 0 || value.length > 45) return false;
	// 3連コロン以上は常に不正
	if (value.includes(":::")) return false;
	// `::` 省略表記は1回まで
	const segments = value.split(":");
	if (segments.length > 8) return false;
	const doubleColonCount = value.split("::").length - 1;
	if (doubleColonCount > 1) return false;
	const hasDoubleColon = doubleColonCount === 1;
	// 単独の `:` で始まる/終わるのは不正 (`::` で始まる/終わるのは可)
	if (value.startsWith(":") && !value.startsWith("::")) return false;
	if (value.endsWith(":") && !value.endsWith("::")) return false;

	let nonEmpty = 0;
	for (const seg of segments) {
		if (seg === "") continue;
		if (!IPV6_SEGMENT_REGEX.test(seg)) return false;
		nonEmpty++;
	}

	if (hasDoubleColon) {
		// `::` を使う場合、明示セグメント数は最大 7 (1つは省略で表現)
		return nonEmpty <= 7;
	}
	// `::` 無しの完全表記は 8 セグメント必須
	return segments.length === 8 && nonEmpty === 8;
}

/**
 * IPv4 / IPv6 のいずれかとして有効な文字列か判定する。
 * - IPv4: ドット区切り 4 オクテット (各 0–255)。
 * - IPv6: コロン区切り、`::` 省略は最大 1 回、最大 45 文字。IPv4 マップは未対応。
 */
export function isValidIP(value: string): boolean {
	if (IPV4_REGEX.test(value)) return true;
	if (!value.includes(":")) return false;
	return isValidIPv6(value);
}

function pickFromForwardedFor(headerValue: string, trustedHops: number): string | null {
	const parts = headerValue
		.split(",")
		.map((entry) => normalizeIPCandidate(entry))
		.filter((entry): entry is string => entry !== null && entry !== "");

	if (parts.length === 0) return null;

	// 右端から trustedHops 番目を採用 (trustedHops=1 なら最右端 = 直近の信頼プロキシが付与した値)
	const index = parts.length - trustedHops;
	if (index < 0) {
		// 期待より hop 数が少ない場合は左端まで遡らない (詐称耐性を優先)
		return null;
	}
	const candidate = parts[index];
	if (!(candidate && isValidIP(candidate))) return null;
	return candidate;
}

function pickSingleTrustedHeader(headerValue: string | null): string | null {
	if (!headerValue) return null;
	const normalized = normalizeIPCandidate(headerValue);
	if (!(normalized && isValidIP(normalized))) return null;
	return normalized;
}

/**
 * 信頼するアプリケーション前段プロキシを返す。
 * - `x-vercel-forwarded-for` や `cf-connecting-ip` はその CDN を経由する場合のみ
 *   付与・上書きされるため、別環境では攻撃者が自由に詐称できる。実際にその
 *   環境にデプロイされている場合のみ信頼する。
 * - Vercel ランタイムは `VERCEL` env を自動付与するので自動検出する。
 * - Cloudflare 等は自動検出できないため `TRUSTED_PROXY_PROVIDER` で明示する。
 */
function getTrustedProxyProvider(): "vercel" | "cloudflare" | null {
	const explicit = process.env.TRUSTED_PROXY_PROVIDER?.trim().toLowerCase();
	if (explicit === "vercel" || explicit === "cloudflare") return explicit;
	if (process.env.VERCEL) return "vercel";
	return null;
}

/**
 * `Headers` (および互換オブジェクト) から信頼できるクライアント IP を抽出する。
 *
 * 評価順:
 * 1. `x-vercel-forwarded-for` — Vercel 環境と判定された場合のみ。
 * 2. `cf-connecting-ip` — `TRUSTED_PROXY_PROVIDER=cloudflare` の場合のみ。
 * 3. `x-forwarded-for` — 右端から `TRUSTED_PROXY_HOPS` 個目 (デフォルト 1) を採用。
 *    値が IP として不正、または hop 数が足りない場合は次の候補に進む。
 * 4. `x-real-ip` — 単一プロキシ環境用の最終フォールバック。
 *
 * @returns 妥当な IPv4/IPv6 が抽出できれば文字列、抽出できなければ `null`。
 */
export function getClientIPFromHeaders(headers: ReadonlyHeadersLike): string | null {
	const provider = getTrustedProxyProvider();

	if (provider === "vercel") {
		const vercel = pickSingleTrustedHeader(headers.get("x-vercel-forwarded-for"));
		if (vercel) return vercel;
	}

	if (provider === "cloudflare") {
		const cloudflare = pickSingleTrustedHeader(headers.get("cf-connecting-ip"));
		if (cloudflare) return cloudflare;
	}

	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		const fromXff = pickFromForwardedFor(forwardedFor, readTrustedProxyHops());
		if (fromXff) return fromXff;
	}

	const realIP = pickSingleTrustedHeader(headers.get("x-real-ip"));
	if (realIP) return realIP;

	return null;
}

/**
 * `NextRequest` 互換のオブジェクトからクライアント IP を抽出するための薄いラッパ。
 * 中身は {@link getClientIPFromHeaders} に委譲する。
 */
export function getClientIP(request: RequestLike): string | null {
	return getClientIPFromHeaders(request.headers);
}
