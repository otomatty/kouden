import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { googleOidc, OidcError } from "../src/auth/google.ts";

const CLIENT_ID = "client-123.apps.googleusercontent.com";

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
	const pair = await generateKeyPair("RS256");
	privateKey = pair.privateKey;
	const jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
	jwks = createLocalJWKSet({ keys: [jwk] });
});

async function idToken(
	claims: Record<string, unknown>,
	overrides: { aud?: string; iss?: string } = {},
) {
	return new SignJWT(claims)
		.setProtectedHeader({ alg: "RS256", kid: "k1" })
		.setIssuer(overrides.iss ?? "https://accounts.google.com")
		.setAudience(overrides.aud ?? CLIENT_ID)
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(privateKey);
}

function providerReturning(body: unknown, status = 200) {
	const calls: URLSearchParams[] = [];
	const fetchStub = (async (_url: string | URL | Request, init?: RequestInit) => {
		calls.push(new URLSearchParams(String(init?.body)));
		return Response.json(body, { status });
	}) as typeof fetch;
	return {
		provider: googleOidc({ clientId: CLIENT_ID, clientSecret: "secret", fetch: fetchStub, jwks }),
		calls,
	};
}

const params = { code: "c", codeVerifier: "v", redirectUri: "https://example.jp/cb", nonce: "n1" };

describe("googleOidc", () => {
	it("認可 URL に PKCE・state・nonce を含める", () => {
		const { provider } = providerReturning({});
		const url = new URL(
			provider.authorizationUrl({
				state: "s",
				nonce: "n",
				codeChallenge: "cc",
				redirectUri: "https://example.jp/cb",
			}),
		);
		expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
		expect(Object.fromEntries(url.searchParams)).toMatchObject({
			client_id: CLIENT_ID,
			scope: "openid email profile",
			state: "s",
			nonce: "n",
			code_challenge: "cc",
			code_challenge_method: "S256",
		});
	});

	it("正しい ID トークンなら属性を返し、code_verifier を送る", async () => {
		const token = await idToken({
			sub: "123",
			email: "a@example.com",
			email_verified: true,
			name: "A",
			nonce: "n1",
		});
		const { provider, calls } = providerReturning({ id_token: token });

		const claims = await provider.exchangeAndVerify(params);

		expect(claims).toEqual({
			sub: "123",
			email: "a@example.com",
			emailVerified: true,
			name: "A",
			picture: undefined,
		});
		expect(calls[0]?.get("code_verifier")).toBe("v");
		expect(calls[0]?.get("grant_type")).toBe("authorization_code");
	});

	it("nonce が違えば拒否する", async () => {
		const token = await idToken({ sub: "1", email: "a@example.com", nonce: "other" });
		const { provider } = providerReturning({ id_token: token });
		await expect(provider.exchangeAndVerify(params)).rejects.toThrow(OidcError);
	});

	it("aud が自分のクライアントでなければ拒否する", async () => {
		const token = await idToken(
			{ sub: "1", email: "a@example.com", nonce: "n1" },
			{ aud: "someone-else" },
		);
		const { provider } = providerReturning({ id_token: token });
		await expect(provider.exchangeAndVerify(params)).rejects.toThrow(OidcError);
	});

	it("発行者が Google でなければ拒否する", async () => {
		const token = await idToken(
			{ sub: "1", email: "a@example.com", nonce: "n1" },
			{ iss: "https://evil.example" },
		);
		const { provider } = providerReturning({ id_token: token });
		await expect(provider.exchangeAndVerify(params)).rejects.toThrow(OidcError);
	});

	it("トークンエンドポイントがエラーを返したら拒否する", async () => {
		const { provider } = providerReturning({ error: "invalid_grant" }, 400);
		await expect(provider.exchangeAndVerify(params)).rejects.toThrow(OidcError);
	});

	it("email_verified がなければ未確認として扱う", async () => {
		const token = await idToken({ sub: "1", email: "a@example.com", nonce: "n1" });
		const { provider } = providerReturning({ id_token: token });
		expect((await provider.exchangeAndVerify(params)).emailVerified).toBe(false);
	});
});
