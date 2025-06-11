/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createRolePermission } from "../createRolePermission";
import { listRolePermissions } from "../listRolePermissions";
import { deleteRolePermission } from "../deleteRolePermission";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("common role_permissions server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeMapping = {
		role_id: "role-uuid",
		permission_id: "perm-uuid",
	};

	beforeEach(() => {
		supabaseMock = {
			schema: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};
		// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	// Test case: createRolePermission が正常に実行され、マッピングを返す
	it("createRolePermission returns created mapping", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeMapping, error: null });
		const result = await createRolePermission({
			roleId: "role-uuid",
			permissionId: "perm-uuid",
		});
		expect(result).toEqual(fakeMapping);
	});

	// Test case: createRolePermission がエラーを返した場合に例外を投げる
	it("createRolePermission throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createRolePermission({ roleId: "role-uuid", permissionId: "perm-uuid" }),
		).rejects.toThrow("fail");
	});

	// Test case: listRolePermissions が正常にマッピング配列を返す
	it("listRolePermissions returns array of mappings", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeMapping], error: null });
		const result = await listRolePermissions("role-uuid");
		expect(result).toEqual([fakeMapping]);
	});

	// Test case: listRolePermissions がエラーを返した場合に例外を投げる
	it("listRolePermissions throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listRolePermissions("role-uuid")).rejects.toThrow("fail");
	});

	// Test case: deleteRolePermission が正常に実行され true を返す
	it("deleteRolePermission returns true", async () => {
		supabaseMock.eq = vi
			.fn()
			.mockReturnValueOnce(supabaseMock)
			.mockResolvedValueOnce({ error: null });
		const result = await deleteRolePermission({ roleId: "role-uuid", permissionId: "perm-uuid" });
		expect(result).toBe(true);
	});

	// Test case: deleteRolePermission がエラーを返した場合に例外を投げる
	it("deleteRolePermission throws on error", async () => {
		supabaseMock.eq = vi
			.fn()
			.mockReturnValueOnce(supabaseMock)
			.mockResolvedValueOnce({ error: new Error("fail") });
		await expect(
			deleteRolePermission({ roleId: "role-uuid", permissionId: "perm-uuid" }),
		).rejects.toThrow("fail");
	});
});
