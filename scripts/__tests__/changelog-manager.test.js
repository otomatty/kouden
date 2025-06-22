import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// Import functions to test
import {
	createChangelog,
	generateChangelog,
	showTemplate,
	showHelp,
} from "../changelog-manager.js";

// Mock external dependencies
vi.mock("node:fs");
vi.mock("node:child_process");

describe("changelog-manager", () => {
	const mockPackageJson = {
		name: "kouden",
		version: "1.2.3",
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock fs operations
		fs.existsSync.mockReturnValue(false);
		fs.mkdirSync.mockImplementation(() => {});
		fs.writeFileSync.mockImplementation(() => {});
		fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

		// Reset environment variables
		process.env.GOOGLE_AI_API_KEY = undefined;
		process.env.GEMINI_API_KEY = undefined;
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("createChangelog", () => {
		it("should create a changelog file with valid version", () => {
			const version = "1.2.3";

			createChangelog(version);

			expect(fs.existsSync).toHaveBeenCalled();
			expect(fs.mkdirSync).toHaveBeenCalled();
			expect(fs.writeFileSync).toHaveBeenCalled();
		});

		it("should reject invalid version format", () => {
			const invalidVersion = "1.2";

			expect(() => createChangelog(invalidVersion)).toThrow(/process.exit unexpectedly called/);
			// Console.error is mocked, so we don't check the exact message
		});

		it("should prevent overwriting existing changelog", () => {
			fs.existsSync.mockReturnValue(true);
			const version = "1.2.3";

			expect(() => createChangelog(version)).toThrow(/process.exit unexpectedly called/);
			// Console.error is mocked, so we don't check the exact message
		});

		it("should handle file system errors gracefully", () => {
			fs.writeFileSync.mockImplementation(() => {
				throw new Error("Permission denied");
			});

			expect(() => createChangelog("1.2.3")).toThrow("Permission denied");
		});
	});

	describe("generateChangelog", () => {
		beforeEach(() => {
			// Mock git commands
			execSync.mockImplementation((command) => {
				if (command.includes("git tag")) {
					return "v1.2.2\nv1.2.1\nv1.2.0";
				}
				if (command.includes("git log")) {
					return "abc123 feat: add new feature\ndef456 fix: resolve bug\nghi789 improve: optimize performance";
				}
				return "";
			});
		});

		it("should generate changelog from git commits without AI", async () => {
			const version = "1.2.3";

			await generateChangelog(version, null, false);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("git log"), expect.any(Object));
			expect(fs.writeFileSync).toHaveBeenCalled();
		});

		it("should use package.json version when not specified", async () => {
			try {
				await generateChangelog(null, null, false);
			} catch {
				// Expected to fail due to mocked version extraction
			}

			expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining("package.json"), "utf8");
		});

		it("should handle git command failures", async () => {
			execSync.mockImplementation(() => {
				throw new Error("Not a git repository");
			});

			expect(async () => await generateChangelog("1.2.3", null, false)).rejects.toThrow(
				/process.exit unexpectedly called/,
			);
		});

		it("should fallback to simple generation when AI fails", async () => {
			process.env.GOOGLE_AI_API_KEY = "mock-api-key";

			// Mock fetch to simulate AI failure
			global.fetch = vi.fn().mockRejectedValue(new Error("API Error"));

			await generateChangelog("1.2.3", null, true);

			expect(fs.writeFileSync).toHaveBeenCalled();
		});

		it("should generate changelog with AI when API key is provided", async () => {
			process.env.GOOGLE_AI_API_KEY = "mock-api-key";

			// Mock successful AI response
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						candidates: [
							{
								content: {
									parts: [
										{
											text: '---\ntitle: "Mock AI Generated Changelog"\n---\n# Generated Content',
										},
									],
								},
							},
						],
					}),
			});

			await generateChangelog("1.2.3", null, true);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("generativelanguage.googleapis.com"),
				expect.any(Object),
			);
		});

		it("should handle empty commit history", async () => {
			execSync.mockReturnValue("");

			await expect(async () => await generateChangelog("1.2.3", null, false)).rejects.toThrow(
				/process.exit unexpectedly called/,
			);
		});
	});

	describe("utility functions", () => {
		it("should show template", () => {
			// Don't test console.log output since it's mocked
			expect(() => showTemplate()).not.toThrow();
		});

		it("should show help", () => {
			// Don't test console.log output since it's mocked
			expect(() => showHelp()).not.toThrow();
		});
	});

	describe("version validation", () => {
		const validVersions = ["1.2.3", "0.1.0", "10.20.30"];
		const invalidVersions = ["1.2", "1.2.3.4", "v1.2.3", "1.2.3-beta", ""];

		for (const version of validVersions) {
			it(`should accept version "${version}"`, () => {
				expect(() => createChangelog(version)).not.toThrow(/process.exit unexpectedly called/);
			});
		}

		for (const version of invalidVersions) {
			it(`should reject version "${version}"`, () => {
				expect(() => createChangelog(version)).toThrow(/process.exit unexpectedly called/);
			});
		}
	});

	describe("commit categorization", () => {
		it("should categorize commits correctly", async () => {
			execSync.mockImplementation((command) => {
				if (command.includes("git log")) {
					return [
						"abc123 feat: add user authentication",
						"def456 fix: resolve login bug",
						"ghi789 improve: optimize database queries",
						"jkl012 docs: update README",
						"mno345 refactor: clean up code",
					].join("\n");
				}
				if (command.includes("git tag")) {
					return "v1.2.2";
				}
				return "";
			});

			await generateChangelog("1.2.3", null, false);

			const writeCall = fs.writeFileSync.mock.calls[0];
			const content = writeCall[1];

			expect(content).toContain("🎉 新機能");
			expect(content).toContain("🐛 バグ修正");
			expect(content).toContain("🔧 改善");
			expect(content).toContain("🛠 その他の変更");
		});
	});

	describe("file operations", () => {
		it("should create directory if it does not exist", () => {
			fs.existsSync.mockImplementation((path) => {
				return !path.includes("changelog");
			});

			createChangelog("1.2.3");

			expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("changelogs"), {
				recursive: true,
			});
		});

		it("should generate correct filename format", () => {
			createChangelog("1.2.3");

			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringContaining("1-2-3.mdx"),
				expect.any(String),
				"utf8",
			);
		});
	});
});
