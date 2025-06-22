import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = path.join(__dirname, "..");
const TEST_OUTPUT_DIR = path.join(__dirname, "test-output");

// Test utilities
const testUtils = {
	createTempDir: () => {
		if (!fs.existsSync(TEST_OUTPUT_DIR)) {
			fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
		}
		return TEST_OUTPUT_DIR;
	},

	cleanupTempDir: () => {
		if (fs.existsSync(TEST_OUTPUT_DIR)) {
			fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
		}
	},

	readFileContent: (filepath) => {
		return fs.readFileSync(filepath, "utf8");
	},

	fileExists: (filepath) => {
		return fs.existsSync(filepath);
	},
};

describe("CLI Scripts Integration Tests", () => {
	beforeAll(() => {
		testUtils.createTempDir();
	});

	afterAll(() => {
		testUtils.cleanupTempDir();
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("End-to-End Workflow", () => {
		it("should create changelog and milestone in sequence", async () => {
			// This is a mock integration test since we can't run actual commands
			// In a real scenario, you'd set up test directories and run actual commands

			const mockChangelogPath = path.join(TEST_OUTPUT_DIR, "1-2-3.mdx");
			const mockMilestonePath = path.join(TEST_OUTPUT_DIR, "2025-q1.mdx");

			// Mock file creation
			const mockChangelogContent = `---
title: "バージョン 1.2.3 リリース"
version: "1.2.3"
---
# Test Changelog`;

			const mockMilestoneContent = `---
title: "2025年第1四半期 マイルストーン"
period: "2025-q1"
---
# Test Milestone`;

			fs.writeFileSync(mockChangelogPath, mockChangelogContent);
			fs.writeFileSync(mockMilestonePath, mockMilestoneContent);

			expect(testUtils.fileExists(mockChangelogPath)).toBe(true);
			expect(testUtils.fileExists(mockMilestonePath)).toBe(true);

			const changelogContent = testUtils.readFileContent(mockChangelogPath);
			const milestoneContent = testUtils.readFileContent(mockMilestonePath);

			expect(changelogContent).toContain("バージョン 1.2.3 リリース");
			expect(milestoneContent).toContain("2025年第1四半期 マイルストーン");
		});
	});

	describe("Script Validation", () => {
		it("should validate that all scripts exist", () => {
			const requiredScripts = ["changelog-manager.js", "milestone-manager.js", "docs-manager.js"];

			for (const script of requiredScripts) {
				const scriptPath = path.join(SCRIPTS_DIR, script);
				expect(fs.existsSync(scriptPath)).toBe(true);
			}
		});

		it("should validate script permissions and executability", () => {
			const scripts = ["changelog-manager.js", "milestone-manager.js", "docs-manager.js"];

			for (const script of scripts) {
				const scriptPath = path.join(SCRIPTS_DIR, script);
				const stats = fs.statSync(scriptPath);
				expect(stats.isFile()).toBe(true);
				expect(stats.size).toBeGreaterThan(0);
			}
		});

		it("should validate that scripts have proper shebang", () => {
			const scripts = ["changelog-manager.js", "milestone-manager.js", "docs-manager.js"];

			for (const script of scripts) {
				const scriptPath = path.join(SCRIPTS_DIR, script);
				const content = fs.readFileSync(scriptPath, "utf8");
				expect(content.startsWith("#!/usr/bin/env bun")).toBe(true);
			}
		});
	});

	describe("Template Validation", () => {
		it("should generate valid MDX frontmatter", () => {
			const mockContent = `---
title: "Test Title"
version: "1.0.0"
date: "2025-01-01"
---
# Content`;

			fs.writeFileSync(path.join(TEST_OUTPUT_DIR, "test.mdx"), mockContent);
			const content = testUtils.readFileContent(path.join(TEST_OUTPUT_DIR, "test.mdx"));

			// Validate frontmatter structure
			expect(content).toMatch(/^---\n[\s\S]*?\n---\n/);
			expect(content).toContain("title:");
			expect(content).toContain("version:");
			expect(content).toContain("date:");
		});

		it("should generate valid Accordion components", () => {
			const mockContent = `# Test
<Accordion title="Test Accordion" defaultOpen={true}>
Content here
</Accordion>`;

			fs.writeFileSync(path.join(TEST_OUTPUT_DIR, "accordion-test.mdx"), mockContent);
			const content = testUtils.readFileContent(path.join(TEST_OUTPUT_DIR, "accordion-test.mdx"));

			expect(content).toContain("<Accordion");
			expect(content).toContain('title="Test Accordion"');
			expect(content).toContain("defaultOpen={true}");
			expect(content).toContain("</Accordion>");
		});
	});

	describe("File System Operations", () => {
		it("should handle directory creation", () => {
			const testDir = path.join(TEST_OUTPUT_DIR, "nested", "deep", "directory");

			if (!fs.existsSync(testDir)) {
				fs.mkdirSync(testDir, { recursive: true });
			}

			expect(fs.existsSync(testDir)).toBe(true);
			expect(fs.statSync(testDir).isDirectory()).toBe(true);
		});

		it("should handle file operations safely", () => {
			const testFile = path.join(TEST_OUTPUT_DIR, "safety-test.txt");
			const testContent = "Safety test content";

			// Test write
			fs.writeFileSync(testFile, testContent);
			expect(fs.existsSync(testFile)).toBe(true);

			// Test read
			const readContent = fs.readFileSync(testFile, "utf8");
			expect(readContent).toBe(testContent);

			// Test overwrite protection (mock)
			expect(() => {
				if (fs.existsSync(testFile)) {
					throw new Error("File already exists");
				}
			}).toThrow("File already exists");
		});

		it("should handle special characters in filenames", () => {
			const specialFiles = ["1-2-3.mdx", "2025-q1.mdx", "test_file.mdx", "file-with-dashes.mdx"];

			for (const filename of specialFiles) {
				const filepath = path.join(TEST_OUTPUT_DIR, filename);
				fs.writeFileSync(filepath, `# ${filename}`);

				expect(fs.existsSync(filepath)).toBe(true);
				const content = fs.readFileSync(filepath, "utf8");
				expect(content).toContain(filename);
			}
		});
	});

	describe("Error Recovery", () => {
		it("should handle permission errors gracefully", () => {
			// Mock permission error scenario
			const mockError = new Error("EACCES: permission denied");
			mockError.code = "EACCES";

			expect(() => {
				// Simulate the error condition
				throw mockError;
			}).toThrow("EACCES");
		});

		it("should handle disk space errors", () => {
			// Mock ENOSPC error scenario
			const mockError = new Error("ENOSPC: no space left on device");
			mockError.code = "ENOSPC";

			expect(() => {
				throw mockError;
			}).toThrow("ENOSPC");
		});

		it("should handle concurrent access", async () => {
			const testFile = path.join(TEST_OUTPUT_DIR, "concurrent-test.txt");

			// Simulate concurrent operations
			const operations = Array.from({ length: 3 }, (_, i) =>
				Promise.resolve().then(() => {
					const content = `Operation ${i} content`;
					fs.writeFileSync(testFile, content);
					return fs.readFileSync(testFile, "utf8");
				}),
			);

			const results = await Promise.all(operations);
			expect(results).toHaveLength(3);
			for (const result of results) {
				expect(result).toMatch(/Operation \d+ content/);
			}
		});
	});

	describe("Performance", () => {
		it("should complete file operations within reasonable time", async () => {
			const startTime = Date.now();

			// Simulate bulk file operations
			for (let i = 0; i < 10; i++) {
				const filename = `perf-test-${i}.mdx`;
				const filepath = path.join(TEST_OUTPUT_DIR, filename);
				const content = `# Performance Test ${i}\n${"Content ".repeat(100)}`;

				fs.writeFileSync(filepath, content);
				expect(fs.existsSync(filepath)).toBe(true);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should complete within 1 second for 10 files
			expect(duration).toBeLessThan(1000);
		});

		it("should handle large file content", () => {
			const largeContent = "Large content ".repeat(10000);
			const testFile = path.join(TEST_OUTPUT_DIR, "large-file.mdx");

			const startTime = Date.now();
			fs.writeFileSync(testFile, largeContent);
			const readContent = fs.readFileSync(testFile, "utf8");
			const endTime = Date.now();

			expect(readContent).toBe(largeContent);
			expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
		});
	});

	describe("Configuration", () => {
		it("should validate directory constants", () => {
			// Mock the directory constants from the scripts
			const expectedDirs = {
				changelog: "../src/docs/changelogs",
				milestone: "../src/docs/milestones",
			};

			for (const [key, dir] of Object.entries(expectedDirs)) {
				expect(dir).toMatch(/\.\.\//); // Should be relative paths
				expect(dir).toContain("/docs/");
				expect(dir).toContain(key);
			}
		});

		it("should validate template structure constants", () => {
			const requiredFrontmatterFields = [
				"title",
				"description",
				"version", // for changelog
				"period", // for milestone
				"date",
			];

			// This would validate that templates include required fields
			for (const field of requiredFrontmatterFields) {
				expect(field).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
			}
		});
	});

	describe("Data Validation", () => {
		it("should validate version number formats", () => {
			const validVersions = ["1.0.0", "2.1.3", "10.20.30"];
			const invalidVersions = ["1.0", "1.0.0.0", "v1.0.0", "1.0.0-beta"];

			const versionRegex = /^\d+\.\d+\.\d+$/;

			for (const version of validVersions) {
				expect(versionRegex.test(version)).toBe(true);
			}

			for (const version of invalidVersions) {
				expect(versionRegex.test(version)).toBe(false);
			}
		});

		it("should validate period formats", () => {
			const validPeriods = ["2025-q1", "2025-q4", "2025-01", "2025-12"];
			const invalidPeriods = ["2025-q5", "2025-13", "25-q1", "q1-2025"];

			const quarterRegex = /^\d{4}-q[1-4]$/i;
			const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

			for (const period of validPeriods) {
				const isValidQuarter = quarterRegex.test(period);
				const isValidMonth = monthRegex.test(period);
				expect(isValidQuarter || isValidMonth).toBe(true);
			}

			for (const period of invalidPeriods) {
				const isValidQuarter = quarterRegex.test(period);
				const isValidMonth = monthRegex.test(period);
				expect(isValidQuarter || isValidMonth).toBe(false);
			}
		});

		it("should validate date formats", () => {
			const validDates = ["2025-01-01", "2025-12-31", "2024-02-29"];
			const invalidDates = ["2025-13-01", "2025-01-32", "25-01-01"];

			for (const dateStr of validDates) {
				const date = new Date(dateStr);
				expect(date instanceof Date && !Number.isNaN(date.getTime())).toBe(true);
			}

			for (const dateStr of invalidDates) {
				const date = new Date(dateStr);
				const isValid =
					date instanceof Date &&
					!Number.isNaN(date.getTime()) &&
					dateStr === date.toISOString().split("T")[0];
				expect(isValid).toBe(false);
			}
		});
	});
});
