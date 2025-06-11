/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createPermission } from "../createPermission";
import { listPermissions } from "../listPermissions";
import { getPermission } from "../getPermission";
import { updatePermission } from "../updatePermission";
import { deletePermission } from "../deletePermission";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("common permissions server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakePermission = {
		id: "uuid",
		action: "read",
		resource: "documents",
	};

	beforeEach(() => {
		supabaseMock = {
			schema: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};
		// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	// Test case: createPermission が正常に実行され、作成された権限を返す
	it("createPermission returns created permission", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePermission, error: null });
		const result = await createPermission({
			action: "read",
			resource: "documents",
		});
		expect(result).toEqual(fakePermission);
	});

	// Test case: createPermission がエラーを返した場合に例外を投げる
	it("createPermission throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(createPermission({ action: "read", resource: "documents" })).rejects.toThrow(
			"fail",
		);
	});

	// Test case: listPermissions が配列を返す
	it("listPermissions returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakePermission], error: null });
		const result = await listPermissions();
		expect(result).toEqual([fakePermission]);
	});

	// Test case: listPermissions がエラーを返した場合に例外を投げる
	it("listPermissions throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listPermissions()).rejects.toThrow("fail");
	});

	// Test case: getPermission が正常に権限を返す
	it("getPermission returns permission", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakePermission, error: null });
		const result = await getPermission("uuid");
		expect(result).toEqual(fakePermission);
	});

	// Test case: getPermission がエラーを返した場合に例外を投げる
	it("getPermission throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getPermission("uuid")).rejects.toThrow("fail");
	});

	// Test case: updatePermission が正常に更新された権限を返す
	it("updatePermission returns updated permission", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePermission, error: null });
		const result = await updatePermission({ id: "uuid", action: "write" });
		expect(result).toEqual(fakePermission);
	});

	// Test case: updatePermission がエラーを返した場合に例外を投げる
	it("updatePermission throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updatePermission({ id: "uuid", resource: "docs" })).rejects.toThrow("fail");
	});

	// Test case: deletePermission が正常に実行され true を返す
	it("deletePermission returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deletePermission("uuid");
		expect(result).toBe(true);
	});

	// Test case: deletePermission がエラーを返した場合に例外を投げる
	it("deletePermission throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deletePermission("uuid")).rejects.toThrow("fail");
	});
});
