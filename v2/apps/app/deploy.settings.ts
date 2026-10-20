/**
 * 環境（mode）ごとの設定。cloudflare.config.ts とスクリプトの両方から参照する。
 *
 * `DOMAIN` と `googleClientId` が仮の値のままなら `deployBlockers` がデプロイを止める。
 */
export type Mode = "development" | "staging" | "rehearsal" | "production";

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
	/**
	 * アプリ全体を守る Access。staging / rehearsal は常に必須で、rehearsal だけは取り込み口と同じ専用 AUD を使う。
	 * production は一般公開まで設定して運営者限定にし、公開するときに空に戻してデプロイし直す
	 */
	access: { teamDomain: string; aud: string };
	/**
	 * 旧アプリからのデータ移行の取り込み口（/internal/import/*、05 §2）。Cloudflare Access のサービストークンで守る。
	 * teamDomain は `<team>.cloudflareaccess.com`、aud は取り込み用の Access アプリケーションの AUD タグ。
	 * 空なら取り込み口は無効（404）。リハーサル・切り替えの間だけ設定し、終わったら空に戻してデプロイし直す
	 */
	importAccess: { teamDomain: string; aud: string };
	/** development でだけ使う取り込み用のトークン（Authorization: Bearer）。staging / production では必ず空 */
	importDevToken: string;
	/** /internal/import/rollback/* の全件抽出専用。通常の取り込み・画面とは別の Access アプリを設定する */
	rollbackAccess: { teamDomain: string; aud: string };
	/** development 専用。取り込みトークンとは別の値にする */
	rollbackDevToken: string;
}

const PLACEHOLDER_DOMAIN = "example.jp";
const PLACEHOLDER_CLIENT_ID = "REPLACE_ME.apps.googleusercontent.com";

export const DOMAIN = "kouden.app";
export const WORKERS_SUBDOMAIN = "saedgewell";
/** アカウントの Zero Trust 組織（staging・本番の運営者画面で共通） */
export const ACCESS_TEAM = "black-disk-617a.cloudflareaccess.com";

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
		rollbackAccess: { teamDomain: "", aud: "" },
		rollbackDevToken: "dev-rollback-token",
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
			teamDomain: ACCESS_TEAM,
			aud: "f32cfcbc9bfda4f2aee49b8b1d832542300f77f17c97924bfb7359f9e3ada00d",
		},
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "",
		rollbackAccess: { teamDomain: "", aud: "" },
		rollbackDevToken: "",
	},
	// 本番スナップショットを投入して削除する一時環境。通常の staging のユーザーやセッションを変更しない。
	rehearsal: {
		workerName: "kouden-app-rehearsal",
		origin: `https://kouden-app-rehearsal.${WORKERS_SUBDOMAIN}.workers.dev`,
		d1: { name: "kouden-db-rehearsal" },
		r2: { name: "kouden-files-rehearsal" },
		mailFrom: "",
		billingEnabled: false,
		rateLimitNamespaces: { auth: "3001", write: "3002", invite: "3003" },
		// API 検証専用。Google ログイン用クライアントは使わない。
		googleClientId: "disabled-for-rehearsal",
		access: { teamDomain: "", aud: "" },
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "",
		rollbackAccess: { teamDomain: "", aud: "" },
		rollbackDevToken: "",
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
		googleClientId: "148244071330-8sros0m9gbf0udl6ap50t0u51ti2qijl.apps.googleusercontent.com",
		access: { teamDomain: "", aud: "" },
		importAccess: { teamDomain: "", aud: "" },
		importDevToken: "",
		rollbackAccess: { teamDomain: "", aud: "" },
		rollbackDevToken: "",
	},
};

/** アプリ全体に Access を要求するか。production は access が設定されている間（一般公開前）だけ要求する */
export function appAccessRequired(mode: Mode): boolean {
	if (mode === "staging" || mode === "rehearsal") return true;
	return mode === "production" && MODES.production.access.aud !== "";
}

/** 未指定は development とし、未知の mode は設定を選ぶ前に拒否する。 */
export function resolveMode(mode: string | undefined): Mode {
	if (mode === undefined || mode === "development") return "development";
	if (mode === "staging" || mode === "rehearsal" || mode === "production") return mode;
	throw new Error(
		`Unknown mode: ${mode}（development / staging / rehearsal / production のいずれか）`,
	);
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
		(mode === "staging" || mode === "rehearsal") &&
		(!s.access.teamDomain.endsWith(".cloudflareaccess.com") || !s.access.aud)
	) {
		blockers.push(`${mode} の access.teamDomain と access.aud を設定してください`);
	}
	if (mode === "production") {
		const { teamDomain, aud } = s.access;
		if (
			(teamDomain === "") !== (aud === "") ||
			(teamDomain !== "" && !teamDomain.endsWith(".cloudflareaccess.com"))
		)
			blockers.push(
				"production の access は teamDomain と aud の両方を設定するか、両方を空にしてください",
			);
	}
	if (mode === "rehearsal") {
		if (s.d1.id !== undefined)
			blockers.push("rehearsal の D1 は ID を指定せず専用の名前で作成してください");
		if (!s.importAccess.teamDomain.endsWith(".cloudflareaccess.com") || !s.importAccess.aud)
			blockers.push("rehearsal の importAccess を設定してください");
		if (s.access.teamDomain !== s.importAccess.teamDomain || s.access.aud !== s.importAccess.aud)
			blockers.push("rehearsal の access と importAccess は同じ teamDomain・aud にしてください");
		if (s.mailFrom || s.billingEnabled)
			blockers.push("rehearsal のメール・決済は無効にしてください");
		for (const live of [MODES.staging, MODES.production]) {
			if (
				[live.access.aud, live.importAccess.aud, live.rollbackAccess.aud].some(
					(aud) => aud !== "" && (aud === s.access.aud || aud === s.importAccess.aud),
				)
			)
				blockers.push("rehearsal の Access AUD は通常環境と分離してください");
			if (
				s.workerName === live.workerName ||
				s.d1.name === live.d1.name ||
				s.r2.name === live.r2.name
			)
				blockers.push("rehearsal の Worker・D1・R2 は通常環境と分離してください");
		}
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
	if (s.rollbackDevToken !== "") blockers.push(`${mode} に rollbackDevToken が設定されています`);
	if (
		(s.rollbackAccess.teamDomain === "") !== (s.rollbackAccess.aud === "") ||
		(s.rollbackAccess.teamDomain !== "" &&
			!s.rollbackAccess.teamDomain.endsWith(".cloudflareaccess.com"))
	)
		blockers.push(`${mode} の rollbackAccess に有効な teamDomain と aud の両方を設定してください`);
	if (
		Object.entries(MODES).some(([otherMode, other]) => {
			const usedByRollback =
				s.rollbackAccess.aud !== "" &&
				[
					other.access.aud,
					other.importAccess.aud,
					...(otherMode !== mode ? [other.rollbackAccess.aud] : []),
				].includes(s.rollbackAccess.aud);
			const usesOtherRollback =
				otherMode !== mode &&
				other.rollbackAccess.aud !== "" &&
				[s.access.aud, s.importAccess.aud].includes(other.rollbackAccess.aud);
			return usedByRollback || usesOtherRollback;
		})
	)
		blockers.push(`${mode} の Access は切り戻し・取り込み・画面・他環境と別の AUD にしてください`);
	return blockers;
}
