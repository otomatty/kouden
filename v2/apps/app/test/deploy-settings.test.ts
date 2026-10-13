import { describe, expect, it } from "vitest";
import { deployBlockers, MODES } from "../deploy.settings.ts";

describe("deployBlockers", () => {
	it("仮のドメインと Client ID が残っている間は staging / production へのデプロイを止める", () => {
		for (const mode of ["staging", "production"] as const) {
			const blockers = deployBlockers(mode);
			expect(blockers.some((b) => b.includes("ドメイン"))).toBe(true);
			expect(blockers.some((b) => b.includes("googleClientId"))).toBe(true);
		}
	});

	it("取り込み用の開発トークンが残っていたり、Access の設定が片方だけだったりするとデプロイを止める", () => {
		const original = structuredClone(MODES.staging);
		try {
			MODES.staging.importDevToken = "x";
			expect(deployBlockers("staging").some((b) => b.includes("importDevToken"))).toBe(true);
			MODES.staging.importDevToken = "";
			MODES.staging.importAccess = { teamDomain: "team.cloudflareaccess.com", aud: "" };
			expect(deployBlockers("staging").some((b) => b.includes("importAccess"))).toBe(true);
			MODES.staging.importAccess = { teamDomain: "team.cloudflareaccess.com", aud: "aud" };
			expect(deployBlockers("staging").some((b) => b.includes("import"))).toBe(false);
		} finally {
			MODES.staging = original;
		}
	});

	it("development はデプロイ先にできない", () => {
		expect(deployBlockers("development")).not.toEqual([]);
	});

	it("mode ごとに Worker 名と D1 名が分かれている", () => {
		const names = Object.values(MODES).map((m) => m.workerName);
		const dbs = Object.values(MODES).map((m) => m.d1.name);
		expect(new Set(names).size).toBe(names.length);
		expect(new Set(dbs).size).toBe(dbs.length);
	});
});
