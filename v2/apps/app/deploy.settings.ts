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
	/** staging の購入は Stripe テストキーと Webhook を設定してから有効にする */
	billingEnabled: boolean;
	/** Rate Limiting binding の namespace（アカウント内で一意な整数文字列） */
	rateLimitNamespaces: { auth: string; write: string; invite: string };
	/** Google OAuth クライアント ID（秘密情報ではない） */
	googleClientId: string;
	/** staging 全体を守る Access。取り込み口は importAccess の別の AUD で検証する */
	access: { teamDomain: string; aud: string };
	/**
	 * 旧アプリからのデータ移行の取り込み口（/internal/import/*、05 §2）。Cloudflare Access のサービストークンで守る。
	 * teamDomain は `<team>.cloudflareaccess.com`、aud は取り込み用の Access アプリケーションの AUD タグ。
	 * 空なら取り込み口は無効（404）。リハーサル・切り替えの間だけ設定し、終わったら空に戻してデプロイし直す
	 */
	importAccess: { teamDomain: string; aud: string };
	/** development でだけ使う取り込み用のトークン（Authorization: Bearer）。staging / production では必ず空 */
	importDevToken: string;
}

const PLACEHOLDER_DOMAIN = "example.jp";
const PLACEHOLDER_CLIENT_ID = "REPLACE_ME.apps.googleusercontent.com";

export const DOMAIN = PLACEHOLDER_DOMAIN;
export const WORKERS_SUBDOMAIN = "saedgewell";
export const STAGING_ACCESS_TEAM = "black-disk-617a.cloudflareaccess.com";

/** ローカル開発用の D1 の ID（ローカルの永続化ファイル名を決めるためだけに使う） */
export const LOCAL_D1_ID = "00000000-0000-4000-8000-00000000d1d1";

export const MODES: Record<Mode, ModeSettings> = {
	development: {
		workerName: "kouden-app-dev",
		origin: "http://localhost:5173",
		d1: { name: "kouden-db-dev", id: LOCAL_D1_ID },
		r2: { name: "kouden-files-dev" },
		mailFrom: "noreply@localhost.test",
		billingEnabled: true,
		rateLimitNamespaces: { auth: "9001", write: "9002", invite: "9003" },
		googleClientId: PLACEHOLDER_CLIENT_ID,
		access: { teamDomain: "", aud: "" },
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "dev-import-token",
	},
	staging: {
		workerName: "kouden-app-staging",
		origin: `https://kouden-app-staging.${WORKERS_SUBDOMAIN}.workers.dev`,
		d1: { name: "kouden-db-staging" },
		r2: { name: "kouden-files-staging" },
		// 送信ドメインを用意するまでリハーサル環境からメールは送らない
		mailFrom: "",
		billingEnabled: false,
		rateLimitNamespaces: { auth: "2001", write: "2002", invite: "2003" },
		googleClientId: "569940434834-tubk2ub196e34na7e97tqt44ljrn97vq.apps.googleusercontent.com",
		access: {
			teamDomain: STAGING_ACCESS_TEAM,
			aud: "f32cfcbc9bfda4f2aee49b8b1d832542300f77f17c97924bfb7359f9e3ada00d",
		},
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "",
	},
	production: {
		workerName: "kouden-app",
		origin: `https://${DOMAIN}`,
		domain: DOMAIN,
		d1: { name: "kouden-db" },
		r2: { name: "kouden-files" },
		mailFrom: `noreply@${DOMAIN}`,
		billingEnabled: true,
		rateLimitNamespaces: { auth: "1001", write: "1002", invite: "1003" },
		googleClientId: PLACEHOLDER_CLIENT_ID,
		access: { teamDomain: "", aud: "" },
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "",
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
	const origin = URL.canParse(s.origin) ? new URL(s.origin) : null;
	if (!origin || origin.protocol !== "https:" || origin.origin !== s.origin) {
		blockers.push(`${mode} の origin は HTTPS のオリジンにしてください`);
	}
	if (!s.domain && origin?.hostname !== `${s.workerName}.${WORKERS_SUBDOMAIN}.workers.dev`) {
		blockers.push(`${mode} の origin が workers.dev の Worker 名と一致しません`);
	}
	if (s.domain && origin?.hostname !== s.domain) {
		blockers.push(`${mode} の origin とドメインが一致しません`);
	}
	if (
		mode === "staging" &&
		(!s.access.teamDomain.endsWith(".cloudflareaccess.com") || !s.access.aud)
	) {
		blockers.push("staging の access.teamDomain と access.aud を設定してください");
	}
	if (s.domain?.endsWith(PLACEHOLDER_DOMAIN)) {
		blockers.push(
			`ドメインが仮の値（${s.domain}）のままです。deploy.settings.ts の DOMAIN を置き換えてください`,
		);
	}
	if (s.googleClientId === PLACEHOLDER_CLIENT_ID) {
		blockers.push(`${mode} の googleClientId が仮の値のままです`);
	}
	if (s.importDevToken !== "") {
		blockers.push(
			`${mode} に importDevToken が設定されています（取り込み口を Access なしで開けます）`,
		);
	}
	if ((s.importAccess.teamDomain === "") !== (s.importAccess.aud === "")) {
		blockers.push(
			`${mode} の importAccess は teamDomain と aud の両方を設定するか、両方を空にしてください`,
		);
	}
	return blockers;
}
