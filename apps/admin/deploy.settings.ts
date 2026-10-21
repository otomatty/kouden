/**
 * 運営者画面（kouden-admin）の環境ごとの設定。D1 は利用者向けアプリ（apps/app）と同じものを使うので、
 * ドメインと D1 の設定は apps/app/deploy.settings.ts から読む。
 *
 * TODO(M5): Cloudflare Access のアプリケーションを作ったら、各 mode の `access` を実際の値に置き換える。
 * 置き換えるまでは `deployBlockers` がデプロイを止める。
 */
import {
	DOMAIN,
	MODES as APP_MODES,
	type Mode as AppMode,
	resolveMode as resolveAppMode,
	WORKERS_SUBDOMAIN,
	ACCESS_TEAM,
} from "../app/deploy.settings.ts";

export type Mode = Exclude<AppMode, "rehearsal">;

/** 一時リハーサルに運営者画面は配置しない。通常の staging 設定にフォールバックさせない。 */
export function resolveMode(value: string | undefined): Mode {
	const mode = resolveAppMode(value);
	if (mode === "rehearsal") throw new Error("運営者画面は rehearsal にデプロイできません");
	return mode;
}

export interface AdminModeSettings {
	workerName: string;
	/** 公開 URL のオリジン（CSRF の検査に使う） */
	origin: string;
	domain?: string;
	d1: { name: string; id?: string };
	/** 利用者向けアプリのオリジン（香典帳へのリンクには使わない。表示用） */
	appOrigin: string;
	/**
	 * Cloudflare Access。teamDomain は `<team>.cloudflareaccess.com`、aud はアプリケーションの AUD タグ。
	 * development では Access を通らないので空にし、devEmail を運営者として扱う
	 */
	access: { teamDomain: string; aud: string };
	/** development でだけ使う運営者のメールアドレス。staging / production では必ず空 */
	devEmail: string;
}

const PLACEHOLDER_TEAM = "REPLACE_ME.cloudflareaccess.com";
const PLACEHOLDER_AUD = "REPLACE_ME";

export const MODES: Record<Mode, AdminModeSettings> = {
	development: {
		workerName: "kouden-admin-dev",
		origin: "http://localhost:5174",
		d1: APP_MODES.development.d1,
		appOrigin: APP_MODES.development.origin,
		access: { teamDomain: "", aud: "" },
		devEmail: "admin@localhost.test",
	},
	staging: {
		workerName: "kouden-admin-staging",
		origin: `https://kouden-admin-staging.${WORKERS_SUBDOMAIN}.workers.dev`,
		d1: APP_MODES.staging.d1,
		appOrigin: APP_MODES.staging.origin,
		access: {
			teamDomain: ACCESS_TEAM,
			aud: "2b070c052a3073c94fbf21764ef9d841306f2b5954905f4cfbc019699d8374bd",
		},
		devEmail: "",
	},
	production: {
		workerName: "kouden-admin",
		origin: `https://admin.${DOMAIN}`,
		domain: `admin.${DOMAIN}`,
		d1: APP_MODES.production.d1,
		appOrigin: APP_MODES.production.origin,
		access: {
			teamDomain: ACCESS_TEAM,
			aud: "0db03f10b99088b6b4d8f053f5dd56a50d6cdcdf10b2166572d126fb09b4bd19",
		},
		devEmail: "",
	},
};

/** デプロイしてはいけない理由（仮の値・開発用の設定が残っているなど）。空ならデプロイしてよい */
export function deployBlockers(mode: Mode): string[] {
	if (mode === "development") return ["development はデプロイ先ではありません"];
	const s = MODES[mode];
	const blockers: string[] = [];
	if (s.access.teamDomain === PLACEHOLDER_TEAM || s.access.teamDomain === "") {
		blockers.push(`${mode} の access.teamDomain が仮の値のままです`);
	}
	if (s.access.aud === PLACEHOLDER_AUD || s.access.aud === "") {
		blockers.push(`${mode} の access.aud が仮の値のままです`);
	}
	if (s.devEmail !== "")
		blockers.push(`${mode} に devEmail が設定されています（Access を迂回します）`);
	if (s.domain?.endsWith("example.jp")) {
		blockers.push(
			`ドメインが仮の値（${s.domain}）のままです。apps/app/deploy.settings.ts の DOMAIN を置き換えてください`,
		);
	}
	return blockers;
}
