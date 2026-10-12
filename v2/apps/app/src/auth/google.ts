import { createRemoteJWKSet, errors as joseErrors, jwtVerify, type JWTVerifyGetKey } from "jose";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** ID トークンから取り出す、アプリで使う属性 */
export interface GoogleClaims {
	sub: string;
	email: string;
	emailVerified: boolean;
	/** Google Workspace のドメイン（`hd` クレーム）。個人の Google アカウントでは無い */
	hostedDomain?: string;
	name?: string;
	picture?: string;
}

export interface OidcProvider {
	authorizationUrl(params: {
		state: string;
		nonce: string;
		codeChallenge: string;
		redirectUri: string;
	}): string;
	/** 認可コードをトークンに交換し、ID トークンを検証して属性を返す */
	exchangeAndVerify(params: {
		code: string;
		codeVerifier: string;
		redirectUri: string;
		nonce: string;
	}): Promise<GoogleClaims>;
}

export class OidcError extends Error {
	override name = "OidcError";
}

// JWKS はアイソレート内でキャッシュされる（jose が Cache-Control に従って更新する）
const googleJwks = createRemoteJWKSet(JWKS_URL);

export function googleOidc(options: {
	clientId: string;
	clientSecret: string;
	fetch?: typeof fetch;
	jwks?: JWTVerifyGetKey;
}): OidcProvider {
	const doFetch = options.fetch ?? fetch;
	const jwks = options.jwks ?? googleJwks;

	return {
		authorizationUrl({ state, nonce, codeChallenge, redirectUri }) {
			const url = new URL(AUTH_ENDPOINT);
			url.search = new URLSearchParams({
				client_id: options.clientId,
				redirect_uri: redirectUri,
				response_type: "code",
				scope: "openid email profile",
				state,
				nonce,
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
				prompt: "select_account",
			}).toString();
			return url.toString();
		},

		async exchangeAndVerify({ code, codeVerifier, redirectUri, nonce }) {
			const res = await doFetch(TOKEN_ENDPOINT, {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					code,
					client_id: options.clientId,
					client_secret: options.clientSecret,
					redirect_uri: redirectUri,
					grant_type: "authorization_code",
					code_verifier: codeVerifier,
				}),
			});
			if (!res.ok) {
				throw new OidcError(`token endpoint returned ${res.status}`);
			}
			const body = (await res.json()) as { id_token?: unknown };
			if (typeof body.id_token !== "string") {
				throw new OidcError("id_token is missing");
			}

			let payload: Record<string, unknown>;
			try {
				({ payload } = await jwtVerify(body.id_token, jwks, {
					issuer: ISSUERS,
					audience: options.clientId,
				}));
			} catch (e) {
				if (e instanceof joseErrors.JOSEError) {
					throw new OidcError(`id_token verification failed: ${e.code}`);
				}
				throw e;
			}

			if (payload.nonce !== nonce) {
				throw new OidcError("nonce mismatch");
			}
			if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
				throw new OidcError("required claims are missing");
			}
			return {
				sub: payload.sub,
				email: payload.email,
				emailVerified: payload.email_verified === true,
				hostedDomain: typeof payload.hd === "string" ? payload.hd : undefined,
				name: typeof payload.name === "string" ? payload.name : undefined,
				picture: typeof payload.picture === "string" ? payload.picture : undefined,
			};
		},
	};
}
