/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createOrderItem } from "../createOrderItem";
import { listOrderItems } from "../listOrderItems";
import { getOrderItem } from "../getOrderItem";
import { updateOrderItem } from "../updateOrderItem";
import { deleteOrderItem } from "../deleteOrderItem";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift order_items server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeItem = {
		order_id: "order-uuid",
		product_id: "prod-uuid",
		quantity: 2,
		unit_price: 500,
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

	// Test case: createOrderItem が正常に実行され、作成された注文アイテムを返す
	it("createOrderItem returns created item", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await createOrderItem({
			orderId: "order-uuid",
			productId: "prod-uuid",
			quantity: 2,
			unitPrice: 500,
		});
		expect(result).toEqual(fakeItem);
	});

	// Test case: createOrderItem がエラーを返した場合に例外を投げる
	it("createOrderItem throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createOrderItem({
				orderId: "order-uuid",
				productId: "prod-uuid",
				quantity: 2,
				unitPrice: 500,
			}),
		).rejects.toThrow("fail");
	});

	// Test case: listOrderItems が正常に配列を返す
	it("listOrderItems returns array of items", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeItem], error: null });
		const result = await listOrderItems("order-uuid");
		expect(result).toEqual([fakeItem]);
	});

	// Test case: listOrderItems がエラーを返した場合に例外を投げる
	it("listOrderItems throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listOrderItems("order-uuid")).rejects.toThrow("fail");
	});

	// Test case: getOrderItem が正常にアイテムを返す
	it("getOrderItem returns item", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await getOrderItem("order-uuid", "prod-uuid");
		expect(result).toEqual(fakeItem);
	});

	// Test case: getOrderItem がエラーを返した場合に例外を投げる
	it("getOrderItem throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getOrderItem("order-uuid", "prod-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateOrderItem が正常に更新されたアイテムを返す
	it("updateOrderItem returns updated item", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await updateOrderItem({
			orderId: "order-uuid",
			productId: "prod-uuid",
			quantity: 3,
		});
		expect(result).toEqual(fakeItem);
	});

	// Test case: updateOrderItem がエラーを返した場合に例外を投げる
	it("updateOrderItem throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			updateOrderItem({ orderId: "order-uuid", productId: "prod-uuid", unitPrice: 600 }),
		).rejects.toThrow("fail");
	});

	// Test case: deleteOrderItem が正常に実行され true を返す
	it("deleteOrderItem returns true", async () => {
		// eq() を2回チェーンし、最終的にエラーがない場合をシミュレート
		supabaseMock.eq = vi
			.fn()
			.mockReturnValueOnce(supabaseMock)
			.mockResolvedValueOnce({ error: null });
		const result = await deleteOrderItem("order-uuid", "prod-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteOrderItem がエラーを返した場合に例外を投げる
	it("deleteOrderItem throws on error", async () => {
		// eq() を2回チェーンし、最終的にエラーをシミュレート
		supabaseMock.eq = vi
			.fn()
			.mockReturnValueOnce(supabaseMock)
			.mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteOrderItem("order-uuid", "prod-uuid")).rejects.toThrow("fail");
	});
});
