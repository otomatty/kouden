/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "../createOrder";
import { listOrders } from "../listOrders";
import { getOrder } from "../getOrder";
import { updateOrder } from "../updateOrder";
import { deleteOrder } from "../deleteOrder";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift orders server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeOrder = {
		id: "order-uuid",
		organization_id: "org",
		customer_id: "cust-uuid",
		total_amount: 1000,
		status: "pending",
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

	// Test case: createOrder が正常に実行され、作成された注文を返す
	it("createOrder returns created order", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await createOrder({
			organizationId: "org",
			customerId: "cust-uuid",
			totalAmount: 1000,
			status: "pending",
		});
		expect(result).toEqual(fakeOrder);
	});

	// Test case: createOrder がエラーを返した場合に例外を投げる
	it("createOrder throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createOrder({ organizationId: "org", customerId: "cust-uuid", totalAmount: 1000 }),
		).rejects.toThrow("fail");
	});

	// Test case: listOrders が配列を返す
	it("listOrders returns array of orders", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeOrder], error: null });
		const result = await listOrders();
		expect(result).toEqual([fakeOrder]);
	});

	// Test case: listOrders がエラーを返した場合に例外を投げる
	it("listOrders throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listOrders()).rejects.toThrow("fail");
	});

	// Test case: getOrder が正常に注文を返す
	it("getOrder returns order", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await getOrder("order-uuid");
		expect(result).toEqual(fakeOrder);
	});

	// Test case: getOrder がエラーを返した場合に例外を投げる
	it("getOrder throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getOrder("order-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateOrder が正常に更新された注文を返す
	it("updateOrder returns updated order", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await updateOrder({ id: "order-uuid", totalAmount: 1500 });
		expect(result).toEqual(fakeOrder);
	});

	// Test case: updateOrder がエラーを返した場合に例外を投げる
	it("updateOrder throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateOrder({ id: "order-uuid", status: "shipped" })).rejects.toThrow("fail");
	});

	// Test case: deleteOrder が正常に実行され true を返す
	it("deleteOrder returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteOrder("order-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteOrder がエラーを返した場合に例外を投げる
	it("deleteOrder throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteOrder("order-uuid")).rejects.toThrow("fail");
	});
});
