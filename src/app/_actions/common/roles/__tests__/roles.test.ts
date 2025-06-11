/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createRole } from "../createRole";
import { listRoles } from "../listRoles";
import { getRole } from "../getRole";
import { updateRole } from "../updateRole";
import { deleteRole } from "../deleteRole";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("common roles server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeRole = {
		id: "uuid",
		name: "Admin",
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

	// Test case: createRole が正常に作成されたロールを返す
	it("createRole returns created role", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeRole, error: null });
		const result = await createRole({ name: "Admin" });
		expect(result).toEqual(fakeRole);
	});

	// Test case: createRole がエラーを返した場合に例外を投げる
	it("createRole throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(createRole({ name: "Admin" })).rejects.toThrow("fail");
	});

	// Test case: listRoles が配列を返す
	it("listRoles returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeRole], error: null });
		const result = await listRoles();
		expect(result).toEqual([fakeRole]);
	});

	// Test case: listRoles がエラーを返した場合に例外を投げる
	it("listRoles throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listRoles()).rejects.toThrow("fail");
	});

	// Test case: getRole が正常にロールを返す
	it("getRole returns role", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeRole, error: null });
		const result = await getRole("uuid");
		expect(result).toEqual(fakeRole);
	});

	// Test case: getRole がエラーを返した場合に例外を投げる
	it("getRole throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getRole("uuid")).rejects.toThrow("fail");
	});

	// Test case: updateRole が正常に更新されたロールを返す
	it("updateRole returns updated role", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeRole, error: null });
		const result = await updateRole({ id: "uuid", name: "User" });
		expect(result).toEqual(fakeRole);
	});

	// Test case: updateRole がエラーを返した場合に例外を投げる
	it("updateRole throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateRole({ id: "uuid", name: "User" })).rejects.toThrow("fail");
	});

	// Test case: deleteRole が正常に実行され true を返す
	it("deleteRole returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteRole("uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteRole がエラーを返した場合に例外を投げる
	it("deleteRole throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteRole("uuid")).rejects.toThrow("fail");
	});
});
