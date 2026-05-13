import { canDeleteKouden } from "@/app/_actions/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteKouden } from "../koudens/delete";

vi.mock("@/app/_actions/permissions", () => ({
	canDeleteKouden: vi.fn(),
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

	it("権限不足時に { success: false, error } を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(canDeleteKouden as any).mockResolvedValue(false);

		const result = await deleteKouden("kouden-1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("削除権限");
		}
		expect(supabaseMock.from).not.toHaveBeenCalled();
	});

	it("DB エラー時に { success: false, error } を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(canDeleteKouden as any).mockResolvedValue(true);
		supabaseMock.eq.mockResolvedValue({ error: { message: "boom", code: "23503" } });

		const result = await deleteKouden("kouden-1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("削除に失敗");
		}
	});

	it("成功時に { success: true } を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(canDeleteKouden as any).mockResolvedValue(true);
		supabaseMock.eq.mockResolvedValue({ error: null });

		const result = await deleteKouden("kouden-1");

		expect(result.success).toBe(true);
		expect(supabaseMock.from).toHaveBeenCalledWith("koudens");
		expect(supabaseMock.delete).toHaveBeenCalled();
		expect(supabaseMock.eq).toHaveBeenCalledWith("id", "kouden-1");
	});

	it("予期せぬ例外時にも { success: false, error } を返す", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(canDeleteKouden as any).mockRejectedValue(new Error("unexpected"));

		const result = await deleteKouden("kouden-1");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("削除に失敗");
		}
	});
});
