/// <reference types="vitest" />
import { requireKoudenOwner } from "@/app/_actions/permissions";
import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteKouden } from "../koudens/delete";

vi.mock("@/app/_actions/permissions", () => ({
	requireKoudenOwner: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("deleteKouden", () => {
	// biome-ignore lint/suspicious/noExplicitAny: supabase mock
	let supabaseMock: any;

	beforeEach(() => {
		supabaseMock = {
			from: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockResolvedValue({ error: null }),
		};
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(createAdminClient as any).mockReturnValue(supabaseMock);
	});

	it("権限不足時に ok:false / FORBIDDEN を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(requireKoudenOwner as any).mockRejectedValue(
			new KoudenError("削除権限がありません", ErrorCodes.FORBIDDEN),
		);

		const result = await deleteKouden("kouden-1");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.FORBIDDEN);
			expect(result.error.message).toContain("権限");
		}
		expect(supabaseMock.from).not.toHaveBeenCalled();
	});

	it("DB エラー時に ok:false を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(requireKoudenOwner as any).mockResolvedValue(undefined);
		supabaseMock.eq.mockResolvedValue({ error: { message: "boom", code: "23503" } });

		const result = await deleteKouden("kouden-1");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.DB_CONSTRAINT_ERROR);
		}
	});

	it("成功時に ok:true を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(requireKoudenOwner as any).mockResolvedValue(undefined);
		supabaseMock.eq.mockResolvedValue({ error: null });

		const result = await deleteKouden("kouden-1");

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data).toBeNull();
		}
		expect(supabaseMock.from).toHaveBeenCalledWith("koudens");
		expect(supabaseMock.delete).toHaveBeenCalled();
		expect(supabaseMock.eq).toHaveBeenCalledWith("id", "kouden-1");
	});

	it("予期せぬ例外時にも ok:false を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(requireKoudenOwner as any).mockRejectedValue(new Error("unexpected"));

		const result = await deleteKouden("kouden-1");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain("香典帳の削除");
		}
	});
});
