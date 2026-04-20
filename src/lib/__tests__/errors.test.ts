/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
	default: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

import {
	ErrorCodes,
	KoudenError,
	toActionError,
	withActionResult,
	withErrorHandling,
} from "../errors";
import logger from "../logger";

describe("KoudenError", () => {
	it("エラーコードに対応するデフォルトHTTPステータスが設定される", () => {
		const err = new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		expect(err.status).toBe(401);
		expect(err.code).toBe("UNAUTHORIZED");
	});

	it("エラーコードに対応する既定のユーザーメッセージが設定される", () => {
		const err = new KoudenError("internal", ErrorCodes.NOT_FOUND);
		expect(err.userMessage).toBe("対象のデータが見つかりませんでした。");
	});

	it("オプションで status / userMessage / details を上書きできる", () => {
		const err = new KoudenError("internal", ErrorCodes.DB_FETCH_ERROR, {
			status: 418,
			userMessage: "Tea time",
			details: { reason: "teapot" },
		});
		expect(err.status).toBe(418);
		expect(err.userMessage).toBe("Tea time");
		expect(err.details).toEqual({ reason: "teapot" });
	});

	it("第3引数として数値を渡すと従来どおり status として扱う（後方互換）", () => {
		const err = new KoudenError("msg", "CUSTOM", 422);
		expect(err.status).toBe(422);
	});

	it("未知のエラーコードは既定値にフォールバックする", () => {
		const err = new KoudenError("msg", "NOT_A_REAL_CODE");
		expect(err.status).toBe(500);
		expect(err.userMessage).toBe("msg");
	});
});

describe("KoudenError.fromSupabase", () => {
	it("PostgREST PGRST116（0行）を NOT_FOUND に変換する", () => {
		const err = KoudenError.fromSupabase(
			{
				code: "PGRST116",
				message: "JSON object requested, multiple (or no) rows returned",
				details: "The result contains 0 rows",
			},
			"メンバー取得",
		);
		expect(err.code).toBe(ErrorCodes.NOT_FOUND);
		expect(err.userMessage).toBe("対象のデータが見つかりませんでした。");
		expect(err.status).toBe(404);
	});

	it("PostgREST PGRST116（複数行）は NOT_FOUND ではなく DB_FETCH_ERROR に分類する", () => {
		const err = KoudenError.fromSupabase(
			{
				code: "PGRST116",
				message: "JSON object requested, multiple (or no) rows returned",
				details: "The result contains 3 rows",
			},
			"メンバー取得",
		);
		expect(err.code).toBe(ErrorCodes.DB_FETCH_ERROR);
		expect(err.userMessage).toContain("想定と一致しませんでした");
	});

	it("PostgrestError（Error 継承）でも Supabase エラーとして変換される", () => {
		class PostgrestError extends Error {
			code = "23505";
			details = "Key (name)=(foo) already exists.";
			hint = null;
			constructor(msg: string) {
				super(msg);
				this.name = "PostgrestError";
			}
		}
		const err = KoudenError.fromSupabase(
			new PostgrestError("duplicate key value violates unique constraint"),
			"関係性の作成",
		);
		expect(err.code).toBe(ErrorCodes.ALREADY_EXISTS);
		expect(err.status).toBe(409);
		expect(err.userMessage).toContain("すでに同じデータ");
	});

	it("Postgres 23505（重複）を ALREADY_EXISTS に変換する", () => {
		const err = KoudenError.fromSupabase(
			{ code: "23505", message: "duplicate key" },
			"関係性の作成",
		);
		expect(err.code).toBe(ErrorCodes.ALREADY_EXISTS);
		expect(err.status).toBe(409);
		expect(err.userMessage).toContain("すでに同じデータ");
	});

	it("Postgres 42501（権限）を FORBIDDEN に変換する", () => {
		const err = KoudenError.fromSupabase({ code: "42501", message: "permission denied" }, "更新");
		expect(err.code).toBe(ErrorCodes.FORBIDDEN);
		expect(err.status).toBe(403);
	});

	it("既存の KoudenError はそのまま返す", () => {
		const original = new KoudenError("msg", ErrorCodes.UNAUTHORIZED);
		expect(KoudenError.fromSupabase(original, "x")).toBe(original);
	});

	it("未知のコードの場合は DB_FETCH_ERROR に分類する", () => {
		const err = KoudenError.fromSupabase({ code: "99999", message: "mysterious" }, "取得");
		expect(err.code).toBe(ErrorCodes.DB_FETCH_ERROR);
		expect(err.userMessage).toBe("取得に失敗しました。");
	});

	it("Error インスタンスは from() に委譲される", () => {
		const err = KoudenError.fromSupabase(new Error("boom"), "処理");
		expect(err.code).toBe(ErrorCodes.UNKNOWN_ERROR);
		expect(err.userMessage).toBe("処理に失敗しました。");
		expect((err as Error & { cause?: unknown }).cause).toBeInstanceOf(Error);
	});

	it("KoudenError.message に生の Supabase メッセージを漏らさない（UI露出対策）", () => {
		const rawMessage = 'duplicate key value violates unique constraint "relationships_name_key"';
		const err = KoudenError.fromSupabase(
			{
				code: "23505",
				message: rawMessage,
				details: "Key (name)=(foo) already exists.",
				hint: null,
			},
			"関係性の作成",
		);
		expect(err.message).not.toContain("duplicate key");
		expect(err.message).not.toContain("relationships_name_key");
		expect(err.message).toBe(err.userMessage);
		// 生メッセージはログ向けに details / cause に退避される
		expect(err.details).toMatchObject({ supabaseMessage: rawMessage });
	});
});

describe("KoudenError.from", () => {
	it("生の Error.message を KoudenError.message に反映しない（UI露出対策）", () => {
		const raw = "Internal server detail: connection string=postgres://...";
		const err = KoudenError.from(new Error(raw), "処理");
		expect(err.message).toBe("処理に失敗しました。");
		expect(err.message).not.toContain("connection string");
		expect(err.details).toMatchObject({ originalMessage: raw });
	});
});

describe("withErrorHandling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("成功時は結果をそのまま返す", async () => {
		const result = await withErrorHandling(async () => 42, "数値取得");
		expect(result).toBe(42);
	});

	it("失敗時は KoudenError を投げ、ログ出力する", async () => {
		await expect(
			withErrorHandling(async () => {
				throw { code: "23505", message: "dup" };
			}, "関係性の作成"),
		).rejects.toMatchObject({
			name: "KoudenError",
			code: ErrorCodes.ALREADY_EXISTS,
		});

		expect(logger.error).toHaveBeenCalledTimes(1);
	});

	it("既存の KoudenError はコードを保持したまま再throwする", async () => {
		const original = new KoudenError("auth", ErrorCodes.UNAUTHORIZED);
		await expect(
			withErrorHandling(async () => {
				throw original;
			}, "何か"),
		).rejects.toBe(original);
	});
});

describe("withActionResult", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("成功時は ok:true の ActionResult を返す", async () => {
		const res = await withActionResult(async () => ({ id: "abc" }), "取得");
		expect(res).toEqual({ ok: true, data: { id: "abc" } });
	});

	it("失敗時は ok:false の ActionResult を返す（throwしない）", async () => {
		const res = await withActionResult(async () => {
			throw { code: "PGRST116", message: "No rows" };
		}, "メンバー取得");

		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.error.code).toBe(ErrorCodes.NOT_FOUND);
			expect(res.error.status).toBe(404);
			expect(res.error.message).toContain("見つかりません");
		}
	});
});

describe("toActionError", () => {
	it("KoudenError を ActionResult のエラー形式に変換する", () => {
		const err = new KoudenError("ng", ErrorCodes.FORBIDDEN);
		const result = toActionError(err, "x");
		expect(result).toEqual({
			ok: false,
			error: {
				code: "FORBIDDEN",
				message: "この操作を行う権限がありません。",
				status: 403,
			},
		});
	});

	it("内部の details はクライアント向け ActionResult には含めない（情報漏洩防止）", () => {
		const err = KoudenError.fromSupabase(
			{
				code: "23505",
				message: "dup",
				details: "Key (name)=(x) already exists.",
				hint: null,
			},
			"作成",
		);
		const result = toActionError(err, "作成");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).not.toHaveProperty("details");
		}
	});
});
