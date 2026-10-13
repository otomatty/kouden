import { describe, expect, it } from "vitest";
import { MODES as APP_MODES } from "../../app/deploy.settings.ts";
import { deployBlockers, MODES } from "../deploy.settings.ts";

describe("deployBlockers（運営者画面）", () => {
	it("Access の設定が仮の値の間は staging / production へのデプロイを止める", () => {
		for (const mode of ["staging", "production"] as const) {
			const blockers = deployBlockers(mode);
			expect(blockers.some((b) => b.includes("access.teamDomain"))).toBe(true);
			expect(blockers.some((b) => b.includes("access.aud"))).toBe(true);
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
