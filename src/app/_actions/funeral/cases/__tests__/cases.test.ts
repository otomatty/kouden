/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createCase } from "../createCase";
import { listCases } from "../listCases";
import { getCase } from "../getCase";
import { updateCase } from "../updateCase";
import { deleteCase } from "../deleteCase";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral cases server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeCase = {
		id: "case-uuid",
		customer_id: "cust-uuid",
		deceased_name: "John Doe",
		venue: "Chapel",
		start_datetime: "2025-02-02T10:00:00Z",
		status: "open",
		organization_id: "org",
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

	// Test case: createCase が正常に実行され、作成されたケースを返す
	it("createCase returns created case", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCase, error: null });
		const result = await createCase({
			customer_id: "cust-uuid",
			deceased_name: "John Doe",
			venue: "Chapel",
			start_datetime: "2025-02-02T10:00:00Z",
			status: "open",
			organizationId: "org",
		});
		expect(result).toEqual(fakeCase);
	});

	// Test case: createCase がエラーを返した場合に例外を投げる
	it("createCase throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createCase({ customer_id: "cust-uuid", deceased_name: "John Doe", organizationId: "org" }),
		).rejects.toThrow("fail");
	});

	// Test case: listCases が配列を返す
	it("listCases returns array of cases", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeCase], error: null });
		const result = await listCases();
		expect(result).toEqual([fakeCase]);
	});

	// Test case: listCases がエラーを返した場合に例外を投げる
	it("listCases throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listCases()).rejects.toThrow("fail");
	});

	// Test case: getCase が正常にケースを返す
	it("getCase returns case", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeCase, error: null });
		const result = await getCase("case-uuid");
		expect(result).toEqual(fakeCase);
	});

	// Test case: getCase がエラーを返した場合に例外を投げる
	it("getCase throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getCase("case-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateCase が正常に更新されたケースを返す
	it("updateCase returns updated case", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCase, error: null });
		const result = await updateCase({ id: "case-uuid", status: "closed" });
		expect(result).toEqual(fakeCase);
	});

	// Test case: updateCase がエラーを返した場合に例外を投げる
	it("updateCase throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateCase({ id: "case-uuid", venue: "Hall" })).rejects.toThrow("fail");
	});

	// Test case: deleteCase が正常に実行され true を返す
	it("deleteCase returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteCase("case-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteCase がエラーを返した場合に例外を投げる
	it("deleteCase throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteCase("case-uuid")).rejects.toThrow("fail");
	});
});
