import type { AccessVerifier } from "./access.ts";

/** 運営者画面の依存。テストでは差し替える */
export interface AdminDeps {
	/** Access の JWT の検証。省略時は ACCESS_TEAM_DOMAIN の公開鍵で検証する */
	verifyAccess?: (env: Env) => AccessVerifier;
	now?: () => Date;
}

export interface AdminEnv {
	Bindings: Env;
	Variables: {
		requestId: string;
		now: Date;
		/** Access で認証した運営者のメールアドレス（監査ログに記録する） */
		adminEmail: string;
		secureHeadersNonce?: string;
	};
}
