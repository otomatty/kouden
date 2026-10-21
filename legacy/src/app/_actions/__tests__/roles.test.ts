/// <reference types="vitest" />
import { createClient } from "@/lib/supabase/server";
import { describe, expect, it, vi } from "vitest";
import { getKoudenRoles } from "../roles";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("getKoudenRoles", () => {
	it("本番のロール名 editor / viewer で絞り込む", async () => {
		// Arrange
		const roles = [
			{ id: "role-editor", name: "editor" },
			{ id: "role-viewer", name: "viewer" },
		];
		const query = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue({ data: roles, error: null }),
		};
		// biome-ignore lint/suspicious/noExplicitAny: mock
		(createClient as any).mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

		// Act
		const result = await getKoudenRoles("kouden-1");

		// Assert
		expect(query.in).toHaveBeenCalledWith("name", ["editor", "viewer"]);
		expect(result).toEqual({ ok: true, data: roles });
	});
});
