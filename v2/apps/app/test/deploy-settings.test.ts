import { describe, expect, it } from "vitest";
import { deployBlockers, MODES } from "../deploy.settings.ts";

describe("deployBlockers", () => {
	it("切り戻しの抽出は専用の Access 設定が必要", () => {
		const original = structuredClone(MODES.staging);
		try {
			MODES.staging.rollbackDevToken = "dev-token";
			expect(deployBlockers("staging").some((b) => b.includes("rollbackDevToken"))).toBe(true);
			MODES.staging.rollbackDevToken = "";
			MODES.staging.rollbackAccess = { teamDomain: "team.cloudflareaccess.com", aud: "" };
			expect(deployBlockers("staging").some((b) => b.includes("rollbackAccess"))).toBe(true);
			MODES.staging.importAccess = { teamDomain: "team.cloudflareaccess.com", aud: "import-aud" };
			for (const aud of ["import-aud", MODES.staging.access.aud]) {
				MODES.staging.rollbackAccess.aud = aud;
				expect(deployBlockers("staging").some((b) => b.includes("別の AUD"))).toBe(true);
			}
			MODES.staging.rollbackAccess.aud = "dedicated-rollback-aud";
			expect(deployBlockers("staging")).toEqual([]);
		} finally {
			MODES.staging = original;
		}
	});
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
	it("rehearsal は専用の Access と保存先が必要で、メールと決済を有効にできない", () => {
		const original = structuredClone(MODES.rehearsal);
		expect(deployBlockers("rehearsal")).not.toEqual([]);
		try {
			MODES.rehearsal.access = { teamDomain: "test.cloudflareaccess.com", aud: "service-aud" };
			MODES.rehearsal.importAccess = { ...MODES.rehearsal.access };
			expect(deployBlockers("rehearsal")).toEqual([]);
			MODES.rehearsal.importAccess.aud = "another-service-aud";
			expect(deployBlockers("rehearsal").some((b) => b.includes("同じ teamDomain・aud"))).toBe(
				true,
			);
			MODES.rehearsal.importAccess = {
				...MODES.rehearsal.access,
				teamDomain: "another.cloudflareaccess.com",
			};
			expect(deployBlockers("rehearsal").some((b) => b.includes("同じ teamDomain・aud"))).toBe(
				true,
			);
			MODES.rehearsal.importAccess = { ...MODES.rehearsal.access };
			MODES.rehearsal.d1 = MODES.staging.d1;
			expect(deployBlockers("rehearsal").some((b) => b.includes("分離"))).toBe(true);
			MODES.rehearsal.d1 = { ...original.d1, id: "existing-database-id" };
			expect(deployBlockers("rehearsal").some((b) => b.includes("ID を指定せず"))).toBe(true);
			MODES.rehearsal.d1 = original.d1;
			MODES.rehearsal.mailFrom = "sender@example.test";
			MODES.rehearsal.billingEnabled = true;
			expect(deployBlockers("rehearsal").some((b) => b.includes("無効"))).toBe(true);
		} finally {
			MODES.rehearsal = original;
		}
	});

	it.each([
		["staging", "access"],
		["staging", "importAccess"],
		["production", "access"],
		["production", "importAccess"],
	] as const)("rehearsal に %s.%s の AUD を流用できない", (mode, accessKey) => {
		const original = structuredClone(MODES.rehearsal);
		const liveAccess = MODES[mode][accessKey];
		try {
			MODES[mode][accessKey] = {
				teamDomain: "test.cloudflareaccess.com",
				aud: `${mode}-${accessKey}-aud`,
			};
			MODES.rehearsal.access = {
				teamDomain: MODES[mode][accessKey].teamDomain,
				aud: "dedicated-rehearsal-aud",
			};
			MODES.rehearsal.importAccess = { ...MODES.rehearsal.access };
			expect(deployBlockers("rehearsal")).toEqual([]);

			MODES.rehearsal.access = { ...MODES[mode][accessKey] };
			MODES.rehearsal.importAccess = { ...MODES.rehearsal.access };
			expect(deployBlockers("rehearsal")).toContain(
				"rehearsal の Access AUD は通常環境と分離してください",
			);
		} finally {
			MODES.rehearsal = original;
			MODES[mode][accessKey] = liveAccess;
		}
	});

	it("mode ごとに Worker 名と D1 名が分かれている", () => {
		const names = Object.values(MODES).map((m) => m.workerName);
		const dbs = Object.values(MODES).map((m) => m.d1.name);
		expect(new Set(names).size).toBe(names.length);
		expect(new Set(dbs).size).toBe(dbs.length);
	});
});
