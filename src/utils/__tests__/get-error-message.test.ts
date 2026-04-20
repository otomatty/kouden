/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
	default: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

import { ErrorCodes, KoudenError } from "@/lib/errors";
import { getErrorMessage } from "../get-error-message";

describe("getErrorMessage", () => {
	it("KoudenError は userMessage を返す", () => {
		const err = new KoudenError("internal", ErrorCodes.UNAUTHORIZED);
		expect(getErrorMessage(err)).toBe("認証が必要です。ログインしてください。");
	});

	it("英語の既知メッセージを日本語に翻訳する", () => {
		expect(getErrorMessage(new Error("Something went wrong"))).toBe("予期せぬエラーが発生しました");
		expect(getErrorMessage(new Error("User not authenticated."))).toBe("認証が必要です");
		expect(getErrorMessage(new Error("Not found"))).toBe("対象のデータが見つかりませんでした");
	});

	it("部分一致の英語メッセージも翻訳する", () => {
		expect(getErrorMessage(new Error("Failed to fetch"))).toBe("通信エラーが発生しました");
	});

	it("未知の日本語メッセージはそのまま返す", () => {
		expect(getErrorMessage(new Error("独自のエラーメッセージ"))).toBe("独自のエラーメッセージ");
	});

	it("文字列エラーも受け取る", () => {
		expect(getErrorMessage("Something went wrong")).toBe("予期せぬエラーが発生しました");
	});

	it("nullや未知の型の場合は既定メッセージを返す", () => {
		expect(getErrorMessage(null)).toBe("予期せぬエラーが発生しました");
		expect(getErrorMessage(undefined)).toBe("予期せぬエラーが発生しました");
		expect(getErrorMessage(123)).toBe("予期せぬエラーが発生しました");
	});

	it("message プロパティを持つオブジェクトを受け取る", () => {
		expect(getErrorMessage({ message: "Network error" })).toBe("通信エラーが発生しました");
	});
});
