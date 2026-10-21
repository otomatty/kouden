import { env } from "cloudflare:test";
import type { GoogleClaims, OidcProvider } from "../src/auth/google.ts";
import { createApp } from "../src/app.tsx";
import type { AppDeps } from "../src/types.ts";

export const ORIGIN = "http://localhost:5173";

/** 簡易 Cookie Jar（テスト用） */
export class CookieJar {
	private cookies = new Map<string, string>();

	store(res: Response): void {
		for (const header of res.headers.getSetCookie()) {
			const [pair = "", ...attrs] = header.split(";");
			const eq = pair.indexOf("=");
			const name = pair.slice(0, eq).trim();
			const value = pair.slice(eq + 1).trim();
			const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a));
			if (expired || value === "") this.cookies.delete(name);
			else this.cookies.set(name, value);
		}
	}

	header(): string {
		return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
	}

	has(name: string): boolean {
		return this.cookies.has(name);
	}
}

/** Google の代わりに、指定した属性を返す OIDC 実装 */
export function fakeOidc(claims: GoogleClaims) {
	const seen: { nonce?: string; codeVerifier?: string } = {};
	const provider: OidcProvider = {
		authorizationUrl: ({ state, nonce }) =>
			`https://accounts.example/auth?state=${encodeURIComponent(state)}&nonce=${encodeURIComponent(nonce)}`,
		async exchangeAndVerify({ nonce, codeVerifier }) {
			seen.nonce = nonce;
			seen.codeVerifier = codeVerifier;
			return claims;
		},
	};
	return { provider, seen };
}

export function makeApp(
	claims: GoogleClaims,
	now?: () => Date,
	deps: Omit<AppDeps, "oidc" | "now"> = {},
) {
	const { provider, seen } = fakeOidc(claims);
	const app = createApp({ ...deps, oidc: () => provider, now });
	const jar = new CookieJar();
	// ログイン開始の回数制限（IP ごと）にテスト同士で干渉しないよう、端末ごとに別の IP にする
	const ip = `192.0.2.${Math.floor(Math.random() * 250) + 1}`;

	const request = async (path: string, init: RequestInit = {}) => {
		const headers = new Headers(init.headers);
		if (!headers.has("cf-connecting-ip")) headers.set("cf-connecting-ip", ip);
		const cookie = jar.header();
		if (cookie) headers.set("cookie", cookie);
		if (init.method && init.method !== "GET") headers.set("origin", ORIGIN);
		const res = await app.request(path, { ...init, headers }, env);
		jar.store(res);
		return res;
	};

	/** start → callback を通してログインし、最後のレスポンスを返す */
	const login = async (returnTo = "/") => {
		const start = await request(`/auth/google/start?return_to=${encodeURIComponent(returnTo)}`);
		const location = new URL(start.headers.get("location") ?? "");
		const state = location.searchParams.get("state") ?? "";
		return request(`/auth/google/callback?code=test-code&state=${encodeURIComponent(state)}`);
	};

	return { app, jar, request, login, seen };
}

export const TARO: GoogleClaims = {
	sub: "google-sub-taro",
	email: "taro.yamada@gmail.com",
	emailVerified: true,
	name: "山田 太郎",
	picture: "https://lh3.googleusercontent.com/a/taro",
};

export const HANAKO: GoogleClaims = {
	sub: "google-sub-hanako",
	email: "hanako.sato@gmail.com",
	emailVerified: true,
	name: "佐藤 花子",
};

export const JIRO: GoogleClaims = {
	sub: "google-sub-jiro",
	email: "jiro.suzuki@gmail.com",
	emailVerified: true,
	name: "鈴木 次郎",
};

/** フォーム送信（application/x-www-form-urlencoded）。htmx からの要求を模す場合は htmx: true */
export function formPost(
	fields: Record<string, string>,
	options: { htmx?: boolean } = {},
): RequestInit {
	const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
	if (options.htmx) headers["hx-request"] = "true";
	return { method: "POST", headers, body: new URLSearchParams(fields).toString() };
}
