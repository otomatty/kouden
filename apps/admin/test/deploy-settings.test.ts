import { describe, expect, it } from "vitest";
import { MODES as APP_MODES } from "../../app/deploy.settings.ts";
import { deployBlockers, MODES, resolveMode } from "../deploy.settings.ts";

describe("deployBlockers（運営者画面）", () => {
	it("rehearsal を staging として解釈せず、デプロイ前に拒否する", () => {
		expect(() => resolveMode("rehearsal")).toThrow("rehearsal にデプロイできません");
	});
	it("本番の Access が仮の値の間はデプロイを止める", () => {
		expect(deployBlockers("production")).toEqual([]);
		expect(deployBlockers("staging")).toEqual([]);
		const original = structuredClone(MODES.production);
		try {
			MODES.production.access = {
				teamDomain: "REPLACE_ME.cloudflareaccess.com",
				aud: "REPLACE_ME",
			};
			const blockers = deployBlockers("production");
			expect(blockers.some((b) => b.includes("access.teamDomain"))).toBe(true);
			expect(blockers.some((b) => b.includes("access.aud"))).toBe(true);
		} finally {
			MODES.production = original;
		}
	});

	it("Access を迂回する devEmail は development にだけ設定する", () => {
		expect(MODES.development.devEmail).not.toBe("");
		expect(MODES.staging.devEmail).toBe("");
		expect(MODES.production.devEmail).toBe("");
		expect(deployBlockers("development")).not.toEqual([]);
	});

	it("利用者向けアプリと同じ D1 を使い、Worker 名は分ける", () => {
		for (const mode of ["development", "staging", "production"] as const) {
			expect(MODES[mode].d1).toEqual(APP_MODES[mode].d1);
			expect(MODES[mode].workerName).not.toBe(APP_MODES[mode].workerName);
		}
	});
});
