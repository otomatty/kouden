/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "../createInvoice";
import { listInvoices } from "../listInvoices";
import { getInvoice } from "../getInvoice";
import { updateInvoice } from "../updateInvoice";
import { deleteInvoice } from "../deleteInvoice";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral invoices server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeInvoice = {
		id: "inv-uuid",
		case_id: "case-uuid",
		amount: 200,
		status: "unpaid",
		due_date: "2025-06-06T00:00:00Z",
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

	// Test case: createInvoice が正常に実行され、作成された請求書を返す
	it("createInvoice returns created invoice", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeInvoice, error: null });
		const result = await createInvoice({
			caseId: "case-uuid",
			amount: 200,
			status: "unpaid",
			dueDate: "2025-06-06T00:00:00Z",
			organizationId: "org",
		});
		expect(result).toEqual(fakeInvoice);
	});

	// Test case: createInvoice がエラーを返した場合に例外を投げる
	it("createInvoice throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createInvoice({ caseId: "case-uuid", amount: 200, organizationId: "org" }),
		).rejects.toThrow("fail");
	});

	// Test case: listInvoices が正常に配列を返す
	it("listInvoices returns array of invoices", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeInvoice], error: null });
		const result = await listInvoices();
		expect(result).toEqual([fakeInvoice]);
	});

	// Test case: listInvoices がエラーを返した場合に例外を投げる
	it("listInvoices throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listInvoices()).rejects.toThrow("fail");
	});

	// Test case: getInvoice が正常に請求書を返す
	it("getInvoice returns invoice", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeInvoice, error: null });
		const result = await getInvoice("inv-uuid");
		expect(result).toEqual(fakeInvoice);
	});

	// Test case: getInvoice がエラーを返した場合に例外を投げる
	it("getInvoice throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getInvoice("inv-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateInvoice が正常に更新された請求書を返す
	it("updateInvoice returns updated invoice", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeInvoice, error: null });
		const result = await updateInvoice({ id: "inv-uuid", status: "paid" });
		expect(result).toEqual(fakeInvoice);
	});

	// Test case: updateInvoice がエラーを返した場合に例外を投げる
	it("updateInvoice throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateInvoice({ id: "inv-uuid", amount: 300 })).rejects.toThrow("fail");
	});

	// Test case: deleteInvoice が正常に実行され true を返す
	it("deleteInvoice returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteInvoice("inv-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteInvoice がエラーを返した場合に例外を投げる
	it("deleteInvoice throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteInvoice("inv-uuid")).rejects.toThrow("fail");
	});
});
