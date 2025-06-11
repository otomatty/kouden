/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createShipping } from "../createShipping";
import { listShipping } from "../listShipping";
import { getShipping } from "../getShipping";
import { updateShipping } from "../updateShipping";
import { deleteShipping } from "../deleteShipping";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift shipping server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeShipping = {
		id: "ship-uuid",
		organization_id: "org",
		order_id: "order-uuid",
		carrier: "DHL",
		tracking_no: "TRACK123",
		status: "shipped",
		delivered_at: "2025-07-07T00:00:00Z",
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

	// Test case: createShipping が正常に実行され、作成された配送情報を返す
	it("createShipping returns created shipping", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeShipping, error: null });
		const result = await createShipping({
			organizationId: "org",
			orderId: "order-uuid",
			carrier: "DHL",
			trackingNo: "TRACK123",
			status: "shipped",
			deliveredAt: "2025-07-07T00:00:00Z",
		});
		expect(result).toEqual(fakeShipping);
	});

	// Test case: createShipping がエラーを返した場合に例外を投げる
	it("createShipping throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createShipping({ organizationId: "org", orderId: "order-uuid", carrier: "DHL" }),
		).rejects.toThrow("fail");
	});

	// Test case: listShipping が配列を返す
	it("listShipping returns array of shipping records", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeShipping], error: null });
		const result = await listShipping();
		expect(result).toEqual([fakeShipping]);
	});

	// Test case: listShipping がエラーを返した場合に例外を投げる
	it("listShipping throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listShipping()).rejects.toThrow("fail");
	});

	// Test case: getShipping が正常に配送情報を返す
	it("getShipping returns shipping record", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeShipping, error: null });
		const result = await getShipping("ship-uuid");
		expect(result).toEqual(fakeShipping);
	});

	// Test case: getShipping がエラーを返した場合に例外を投げる
	it("getShipping throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getShipping("ship-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateShipping が正常に更新された配送情報を返す
	it("updateShipping returns updated shipping record", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeShipping, error: null });
		const result = await updateShipping({ id: "ship-uuid", status: "delivered" });
		expect(result).toEqual(fakeShipping);
	});

	// Test case: updateShipping がエラーを返した場合に例外を投げる
	it("updateShipping throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateShipping({ id: "ship-uuid", carrier: "UPS" })).rejects.toThrow("fail");
	});

	// Test case: deleteShipping が正常に実行され true を返す
	it("deleteShipping returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteShipping("ship-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteShipping がエラーを返した場合に例外を投げる
	it("deleteShipping throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteShipping("ship-uuid")).rejects.toThrow("fail");
	});
});
