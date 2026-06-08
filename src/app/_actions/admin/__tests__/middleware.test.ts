import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { withSuperAdmin } from "../middleware";

// vi.mock ファクトリはモジュール先頭にホイストされるため、ファクトリから参照する
// RedirectError は vi.hoisted で同様に巻き上げて TDZ 参照を防ぐ。
const { RedirectError } = vi.hoisted(() => {
	class RedirectError extends Error {
		constructor(public readonly url: string) {
			super(`NEXT_REDIRECT:${url}`);
		}
	}
	return { RedirectError };
});

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));
// 部分モック: redirect だけ差し替え、unstable_rethrow など他の実エクスポートは残す。
// (@/lib/errors が unstable_rethrow を import/呼び出しするため全置換すると壊れる)
vi.mock("next/navigation", async (importActual) => {
	const actual = await importActual<typeof import("next/navigation")>();
	return {
		...actual,
		redirect: vi.fn((url: string) => {
			throw new RedirectError(url);
		}),
	};
});
vi.mock("../audit-logs", () => ({
	createAuditLog: vi.fn().mockResolvedValue({ ok: true, data: null }),
}));

describe("withSuperAdmin", () => {
	// biome-ignore lint/suspicious/noExplicitAny: テスト用モック
	let supabaseMock: any;

	const buildSupabase = (adminUserResult: { data: unknown; error: unknown }) => ({
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: { id: "user-1" } },
				error: null,
			}),
		},
		from: vi.fn().mockReturnValue({
			select: () => ({
				eq: () => ({
					single: () => Promise.resolve(adminUserResult),
				}),
			}),
		}),
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("super_admin の場合は action を実行して結果を返す", async () => {
		supabaseMock = buildSupabase({ data: { role: "super_admin" }, error: null });
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		const result = await withSuperAdmin(async () => "ok");
		expect(result).toBe("ok");
	});

	it("super_admin でない場合は / にリダイレクトする (action は実行されない)", async () => {
		supabaseMock = buildSupabase({ data: { role: "admin" }, error: null });
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		const action = vi.fn();
		const error = await withSuperAdmin(action).catch((e) => e);
		expect(error).toBeInstanceOf(RedirectError);
		expect((error as RedirectError).url).toBe("/");
		expect(action).not.toHaveBeenCalled();
	});

	it("DB エラー (PGRST116 以外) の場合はリダイレクトせず DB_FETCH_ERROR を投げる", async () => {
		supabaseMock = buildSupabase({
			data: null,
			error: { code: "57P01", message: "database connection lost" },
		});
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		const action = vi.fn();
		const error = await withSuperAdmin(action).catch((e) => e);
		expect(error).toBeInstanceOf(KoudenError);
		expect((error as KoudenError).code).toBe(ErrorCodes.DB_FETCH_ERROR);
		expect(action).not.toHaveBeenCalled();
	});
});
