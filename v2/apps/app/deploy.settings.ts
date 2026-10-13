/**
 * 環境（mode）ごとの設定。cloudflare.config.ts とスクリプトの両方から参照する。
 *
 * TODO(M0): ドメインと Google OAuth クライアントを用意したら、`DOMAIN` と各 mode の
 * `googleClientId` を実際の値に置き換える。置き換えるまでは `deployBlockers` がデプロイを止める。
 */
export type Mode = "development" | "staging" | "production";

export interface ModeSettings {
	/** Worker 名。DO の名前空間も Worker ごとに分かれる */
	workerName: string;
	/** 公開 URL のオリジン。OAuth のリダイレクト先や CSRF の検査に使う */
	origin: string;
	/** カスタムドメイン（development では使わない） */
	domain?: string;
	d1: {
		name: string;
		/** 省略すると `cf deploy` が名前で解決・作成する */
		id?: string;
	};
	/** 返礼品画像などを置く R2 バケット（非公開。Worker が権限を確認して配信する） */
	r2: { name: string };
	/** お知らせメールの送信元（Email Service に登録したドメインのアドレス） */
	mailFrom: string;
	/** Rate Limiting binding の namespace（アカウント内で一意な整数文字列） */
	rateLimitNamespaces: { auth: string; write: string; invite: string };
	/** Google OAuth クライアント ID（秘密情報ではない） */
	googleClientId: string;
}

const PLACEHOLDER_DOMAIN = "example.jp";
const PLACEHOLDER_CLIENT_ID = "REPLACE_ME.apps.googleusercontent.com";

export const DOMAIN = PLACEHOLDER_DOMAIN;

/** ローカル開発用の D1 の ID（ローカルの永続化ファイル名を決めるためだけに使う） */
export const LOCAL_D1_ID = "00000000-0000-4000-8000-00000000d1d1";

export const MODES: Record<Mode, ModeSettings> = {
	development: {
		workerName: "kouden-app-dev",
		origin: "http://localhost:5173",
		d1: { name: "kouden-db-dev", id: LOCAL_D1_ID },
		r2: { name: "kouden-files-dev" },
		mailFrom: "noreply@localhost.test",
		rateLimitNamespaces: { auth: "9001", write: "9002", invite: "9003" },
		googleClientId: PLACEHOLDER_CLIENT_ID,
	},
	staging: {
		workerName: "kouden-app-staging",
		origin: `https://staging.${DOMAIN}`,
		domain: `staging.${DOMAIN}`,
		d1: { name: "kouden-db-staging" },
		r2: { name: "kouden-files-staging" },
		mailFrom: `noreply@staging.${DOMAIN}`,
		rateLimitNamespaces: { auth: "2001", write: "2002", invite: "2003" },
		googleClientId: PLACEHOLDER_CLIENT_ID,
	},
	production: {
		workerName: "kouden-app",
		origin: `https://${DOMAIN}`,
		domain: DOMAIN,
		d1: { name: "kouden-db" },
		r2: { name: "kouden-files" },
		mailFrom: `noreply@${DOMAIN}`,
		rateLimitNamespaces: { auth: "1001", write: "1002", invite: "1003" },
		googleClientId: PLACEHOLDER_CLIENT_ID,
	},
};

export function resolveMode(mode: string | undefined): Mode {
	if (mode === undefined || mode === "development") return "development";
	if (mode === "staging" || mode === "production") return mode;
	throw new Error(`Unknown mode: ${mode}（development / staging / production のいずれか）`);
}

/** デプロイしてはいけない理由（仮の値が残っているなど）。空ならデプロイしてよい */
export function deployBlockers(mode: Mode): string[] {
	if (mode === "development") return ["development はデプロイ先ではありません"];
	const s = MODES[mode];
	const blockers: string[] = [];
	if (s.domain?.endsWith(PLACEHOLDER_DOMAIN)) {
		blockers.push(
			`ドメインが仮の値（${s.domain}）のままです。deploy.settings.ts の DOMAIN を置き換えてください`,
		);
	}
	if (s.googleClientId === PLACEHOLDER_CLIENT_ID) {
		blockers.push(`${mode} の googleClientId が仮の値のままです`);
	}
	return blockers;
}
