import { describe, expect, it } from "vitest";
import { deployBlockers, MODES } from "../deploy.settings.ts";

describe("deployBlockers", () => {
	it("本番に仮のドメインと Client ID が残っている間はデプロイを止める", () => {
		const blockers = deployBlockers("production");
		expect(blockers.some((b) => b.includes("ドメイン"))).toBe(true);
		expect(blockers.some((b) => b.includes("googleClientId"))).toBe(true);
	});

	it("staging は workers.dev を使い、Access が設定されていればデプロイできる", () => {
		expect(deployBlockers("staging")).toEqual([]);
		const original = structuredClone(MODES.staging);
		try {
			MODES.staging.access = { teamDomain: "", aud: "" };
			expect(deployBlockers("staging").some((b) => b.includes("access"))).toBe(true);
			MODES.staging.origin = "https://another.saedgewell.workers.dev";
			expect(deployBlockers("staging").some((b) => b.includes("Worker 名"))).toBe(true);
		} finally {
			MODES.staging = original;
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
