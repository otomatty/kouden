import type { SessionUser } from "./auth/session-store.ts";
import type { OidcProvider } from "./auth/google.ts";
import type { StripeClient } from "./billing/stripe.ts";
import type { KoudenContext } from "./kouden/store.ts";
import type { Caller } from "./ledger/types.ts";
import type { ImportAccessVerifier } from "./migration/auth.ts";

/** アプリ全体で使う依存。テストでは差し替える */
export interface AppDeps {
	/** Google OIDC の実装。省略時は本物の Google を使う */
	oidc?: (env: Env) => OidcProvider;
	now?: () => Date;
	/** Stripe の実装。省略時は STRIPE_SECRET_KEY で本物の API を呼ぶ（未設定なら null） */
	stripe?: (env: Env) => StripeClient | null;
	/** データ移行の取り込み口の Access の検証。省略時は Access の公開鍵で検証する */
	verifyImportAccess?: (env: Env) => ImportAccessVerifier;
	/** staging 全体の Access。取り込み用の検証とは別の AUD を使う */
	verifyAppAccess?: (env: Env) => ImportAccessVerifier;
}

export interface AppEnv {
	Bindings: Env;
	Variables: {
		requestId: string;
		user: SessionUser | null;
		/** 現在のセッショントークン（ログアウト用） */
		sessionToken: string | null;
		now: Date;
		/** Stripe の API（シークレットが未設定なら null） */
		stripe: () => StripeClient | null;
		secureHeadersNonce?: string;
		/** /k/:koudenId 配下でのみ設定される（kouden-access ミドルウェア） */
		kouden: KoudenContext;
		caller: Caller;
		/** 画面を表示した時点の変更ログの位置（ページの GET のみ） */
		renderSeq?: number;
	};
}
