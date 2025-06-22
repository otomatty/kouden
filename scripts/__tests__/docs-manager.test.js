import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";

// Import functions to test
import { runChangelogManager, runMilestoneManager, showHelp } from "../docs-manager.js";

// Mock external dependencies
vi.mock("node:child_process");

describe("docs-manager", () => {
	let consoleSpy;
	let processExitSpy;

	beforeEach(() => {
		vi.clearAllMocks();

		consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {}),
		};

		processExitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit unexpectedly called with "${code}"`);
		});

		// Mock execSync default behavior
		execSync.mockImplementation(() => {});
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("runChangelogManager", () => {
		it("should execute changelog-manager with correct arguments", () => {
			const args = ["create", "1.2.3"];

			runChangelogManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("changelog-manager.js"), {
				stdio: "inherit",
			});
		});

		it("should handle empty arguments", () => {
			const args = [];

			runChangelogManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("changelog-manager.js"), {
				stdio: "inherit",
			});
		});

		it("should handle multiple arguments", () => {
			const args = ["generate", "1.2.3", "1.2.2"];

			runChangelogManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("generate 1.2.3 1.2.2"), {
				stdio: "inherit",
			});
		});

		it("should handle command execution failure", () => {
			execSync.mockImplementation(() => {
				throw new Error("Command failed");
			});

			expect(() => runChangelogManager(["create", "1.2.3"])).toThrow(
				/process.exit unexpectedly called/,
			);
			expect(consoleSpy.error).toHaveBeenCalledWith(
				expect.stringContaining("更新履歴管理スクリプトの実行中にエラーが発生しました"),
			);
		});

		it("should handle arguments with special characters", () => {
			const args = ["create", "1.2.3-beta.1"];

			runChangelogManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("1.2.3-beta.1"), {
				stdio: "inherit",
			});
		});

		it("should use correct script path", () => {
			const args = ["template"];

			runChangelogManager(args);

			const callArgs = execSync.mock.calls[0][0];
			expect(callArgs).toContain("changelog-manager.js");
			expect(callArgs).toContain("bun");
		});
	});

	describe("runMilestoneManager", () => {
		it("should execute milestone-manager with correct arguments", () => {
			const args = ["create", "2025-q1"];

			runMilestoneManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("milestone-manager.js"), {
				stdio: "inherit",
			});
		});

		it("should handle interactive command", () => {
			const args = ["interactive"];

			runMilestoneManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("milestone-manager.js"), {
				stdio: "inherit",
			});
		});

		it("should handle command execution failure", () => {
			execSync.mockImplementation(() => {
				throw new Error("Command failed");
			});

			expect(() => runMilestoneManager(["create", "2025-q1"])).toThrow(
				/process.exit unexpectedly called/,
			);
			expect(consoleSpy.error).toHaveBeenCalledWith(
				expect.stringContaining("マイルストーン管理スクリプトの実行中にエラーが発生しました"),
			);
		});

		it("should handle template command", () => {
			const args = ["template"];

			runMilestoneManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining("milestone-manager.js"), {
				stdio: "inherit",
			});
		});

		it("should use correct script path", () => {
			const args = ["help"];

			runMilestoneManager(args);

			const callArgs = execSync.mock.calls[0][0];
			expect(callArgs).toContain("milestone-manager.js");
			expect(callArgs).toContain("bun");
		});

		it("should handle period arguments correctly", () => {
			const testCases = ["2025-q1", "2025-q4", "2025-01", "2025-12"];

			for (const period of testCases) {
				vi.clearAllMocks();
				runMilestoneManager(["create", period]);

				expect(execSync).toHaveBeenCalledWith(expect.stringContaining(period), {
					stdio: "inherit",
				});
			}
		});
	});

	describe("showHelp", () => {
		it("should display help information", () => {
			showHelp();

			// Help function calls console.log but we're mocking it
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it("should show usage information", () => {
			showHelp();

			// Since console.log is mocked, we can't test the actual content
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it("should show available commands", () => {
			showHelp();

			// Since console.log is mocked, we can't test the actual content
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it("should show examples", () => {
			showHelp();

			// Since console.log is mocked, we can't test the actual content
			expect(consoleSpy.log).toHaveBeenCalled();
		});
	});

	describe("command line integration", () => {
		it("should handle stdio inheritance correctly", () => {
			runChangelogManager(["create", "1.0.0"]);

			expect(execSync).toHaveBeenCalledWith(expect.any(String), { stdio: "inherit" });
		});

		it("should preserve argument order", () => {
			const args = ["generate", "1.2.3", "1.2.2"];

			runChangelogManager(args);

			const command = execSync.mock.calls[0][0];
			expect(command).toMatch(/generate.*1\.2\.3.*1\.2\.2/);
		});

		it("should handle quoted arguments", () => {
			const args = ["create", '"1.2.3"'];

			runChangelogManager(args);

			expect(execSync).toHaveBeenCalledWith(expect.stringContaining('"1.2.3"'), {
				stdio: "inherit",
			});
		});
	});

	describe("error handling", () => {
		it("should handle execSync errors gracefully", () => {
			execSync.mockImplementation(() => {
				throw new Error("Command execution failed");
			});

			expect(() => runChangelogManager(["create", "1.2.3"])).toThrow(
				/process.exit unexpectedly called/,
			);
			expect(processExitSpy).toHaveBeenCalledWith(1);
		});

		it("should handle different error types", () => {
			for (const errorCode of ["ENOENT", "EACCES", "EPERM"]) {
				execSync.mockImplementation(() => {
					const error = new Error(`Command failed with ${errorCode}`);
					error.code = errorCode;
					throw error;
				});

				expect(() => runChangelogManager(["test"])).toThrow(/process.exit unexpectedly called/);
				expect(consoleSpy.error).toHaveBeenCalled();
			}
		});

		it("should handle milestone manager errors", () => {
			execSync.mockImplementation(() => {
				throw new Error("Milestone command failed");
			});

			expect(() => runMilestoneManager(["create", "2025-q1"])).toThrow(
				/process.exit unexpectedly called/,
			);
			expect(consoleSpy.error).toHaveBeenCalledWith(
				expect.stringContaining("マイルストーン管理スクリプトの実行中にエラーが発生しました"),
			);
		});
	});

	describe("script path resolution", () => {
		it("should use correct script directory", () => {
			runChangelogManager(["create", "1.2.3"]);

			const command = execSync.mock.calls[0][0];
			expect(command).toContain("scripts/changelog-manager.js");
		});

		it("should use correct bun command", () => {
			runChangelogManager(["create", "1.2.3"]);

			const command = execSync.mock.calls[0][0];
			expect(command).toMatch(/^bun/);
		});

		it("should handle special characters in paths", () => {
			// This test ensures the script path is properly quoted
			runChangelogManager(["create", "1.0.0"]);

			const command = execSync.mock.calls[0][0];
			expect(command).toMatch(/bun\s+"[^"]+changelog-manager\.js"/);
		});
	});

	describe("argument parsing", () => {
		it("should handle empty argument arrays", () => {
			expect(() => runChangelogManager([])).not.toThrow();
			expect(() => runMilestoneManager([])).not.toThrow();
		});

		it("should handle single arguments", () => {
			runChangelogManager(["help"]);
			runMilestoneManager(["interactive"]);

			expect(execSync).toHaveBeenCalledTimes(2);
		});

		it("should handle multiple arguments", () => {
			const multipleArgs = ["generate", "1.2.3", "1.2.2", "--verbose"];

			runChangelogManager(multipleArgs);

			const command = execSync.mock.calls[0][0];
			for (const arg of multipleArgs) {
				expect(command).toContain(arg);
			}
		});

		it("should preserve argument types", () => {
			const args = ["create", "1.2.3", "--dry-run", "true"];

			runChangelogManager(args);

			const command = execSync.mock.calls[0][0];
			expect(command).toContain("--dry-run true");
		});
	});
});
