/**
 * クライアントIP取得ユーティリティ
 *
 * `x-forwarded-for` の左端を採用するとクライアントが自由に詐称できるため、
 * 信頼できるプロキシ越しのトポロジ前提で右端から信頼 hop 数分遡って採用する。
 *
 * 優先順位:
 * 1. `x-vercel-forwarded-for` (Vercel 環境の信頼ヘッダ)
 * 2. `cf-connecting-ip` (Cloudflare 環境の信頼ヘッダ)
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
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

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

export function isValidIP(value: string): boolean {
	if (IPV4_REGEX.test(value)) return true;
	if (!value.includes(":")) return false;
	// IPv6: must contain at least one colon and only hex characters / colons
	return IPV6_REGEX.test(value) && value.length <= 45;
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

export function getClientIPFromHeaders(headers: ReadonlyHeadersLike): string | null {
	const vercel = pickSingleTrustedHeader(headers.get("x-vercel-forwarded-for"));
	if (vercel) return vercel;

	const cloudflare = pickSingleTrustedHeader(headers.get("cf-connecting-ip"));
	if (cloudflare) return cloudflare;

	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		const fromXff = pickFromForwardedFor(forwardedFor, readTrustedProxyHops());
		if (fromXff) return fromXff;
	}

	const realIP = pickSingleTrustedHeader(headers.get("x-real-ip"));
	if (realIP) return realIP;

	return null;
}

export function getClientIP(request: RequestLike): string | null {
	return getClientIPFromHeaders(request.headers);
}
