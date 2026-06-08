import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSuperAdminPermission } from "../permissions";

// next/navigation の redirect は呼ばれたら専用エラーを投げてフローを中断する挙動を再現する。
// vi.mock ファクトリはホイストされるため、参照する RedirectError も vi.hoisted で巻き上げる。
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

describe("checkSuperAdminPermission", () => {
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

	it("super_admin の場合は supabase/user を返す", async () => {
		supabaseMock = buildSupabase({ data: { role: "super_admin" }, error: null });
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		const result = await checkSuperAdminPermission();
		expect(result.user).toEqual({ id: "user-1" });
		expect(result.supabase).toBe(supabaseMock);
	});

	it("管理者未登録 (PGRST116) の場合は FORBIDDEN を投げる", async () => {
		supabaseMock = buildSupabase({ data: null, error: { code: "PGRST116" } });
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		await expect(checkSuperAdminPermission()).rejects.toMatchObject({
			code: ErrorCodes.FORBIDDEN,
		});
	});

	it("一般管理者 (role !== super_admin) の場合は FORBIDDEN を投げる", async () => {
		supabaseMock = buildSupabase({ data: { role: "admin" }, error: null });
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		await expect(checkSuperAdminPermission()).rejects.toMatchObject({
			code: ErrorCodes.FORBIDDEN,
		});
	});

	it("DB エラー (PGRST116 以外) の場合は FORBIDDEN ではなく DB_FETCH_ERROR を投げる", async () => {
		supabaseMock = buildSupabase({
			data: null,
			error: { code: "57P01", message: "database connection lost" },
		});
		(createClient as unknown as Mock).mockResolvedValue(supabaseMock);

		const error = await checkSuperAdminPermission().catch((e) => e);
		expect(error).toBeInstanceOf(KoudenError);
		expect((error as KoudenError).code).toBe(ErrorCodes.DB_FETCH_ERROR);
	});
});
