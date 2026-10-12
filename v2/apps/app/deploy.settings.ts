/**
 * 環境（mode）ごとの設定。cloudflare.config.ts とスクリプトの両方から参照する。
 *
 * TODO(M0): ドメインを取得したら `domain` を実際の値に置き換える。
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
	/** Rate Limiting binding の namespace（アカウント内で一意な整数文字列） */
	rateLimitNamespace: string;
}

const DOMAIN = "example.jp";

/** ローカル開発用の D1 の ID（ローカルの永続化ファイル名を決めるためだけに使う） */
export const LOCAL_D1_ID = "00000000-0000-4000-8000-00000000d1d1";

export const MODES: Record<Mode, ModeSettings> = {
	development: {
		workerName: "kouden-app-dev",
		origin: "http://localhost:5173",
		d1: { name: "kouden-db-dev", id: LOCAL_D1_ID },
		rateLimitNamespace: "9001",
	},
	staging: {
		workerName: "kouden-app-staging",
		origin: `https://staging.${DOMAIN}`,
		domain: `staging.${DOMAIN}`,
		d1: { name: "kouden-db-staging" },
		rateLimitNamespace: "2001",
	},
	production: {
		workerName: "kouden-app",
		origin: `https://${DOMAIN}`,
		domain: DOMAIN,
		d1: { name: "kouden-db" },
		rateLimitNamespace: "1001",
	},
};

export function resolveMode(mode: string | undefined): Mode {
	if (mode === undefined || mode === "development") return "development";
	if (mode === "staging" || mode === "production") return mode;
	throw new Error(`Unknown mode: ${mode}（development / staging / production のいずれか）`);
}
