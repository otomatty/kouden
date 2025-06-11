/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../createProduct";
import { listProducts } from "../listProducts";
import { getProduct } from "../getProduct";
import { updateProduct } from "../updateProduct";
import { deleteProduct } from "../deleteProduct";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift products server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeProduct = {
		id: "prod-uuid",
		organization_id: "org",
		name: "Widget",
		description: "A product",
		price: 1000,
		sku: "W123",
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

	// Test case: createProduct が正常に実行され、作成された商品を返す
	it("createProduct returns created product", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeProduct, error: null });
		const result = await createProduct({
			organizationId: "org",
			name: "Widget",
			description: "A product",
			price: 1000,
			sku: "W123",
		});
		expect(result).toEqual(fakeProduct);
	});

	// Test case: createProduct がエラーを返した場合に例外を投げる
	it("createProduct throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createProduct({ organizationId: "org", name: "Widget", price: 1000 }),
		).rejects.toThrow("fail");
	});

	// Test case: listProducts が配列を返す
	it("listProducts returns array of products", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeProduct], error: null });
		const result = await listProducts();
		expect(result).toEqual([fakeProduct]);
	});

	// Test case: listProducts がエラーを返した場合に例外を投げる
	it("listProducts throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listProducts()).rejects.toThrow("fail");
	});

	// Test case: getProduct が正常に商品を返す
	it("getProduct returns product", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeProduct, error: null });
		const result = await getProduct("prod-uuid");
		expect(result).toEqual(fakeProduct);
	});

	// Test case: getProduct がエラーを返した場合に例外を投げる
	it("getProduct throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getProduct("prod-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateProduct が正常に更新された商品を返す
	it("updateProduct returns updated product", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeProduct, error: null });
		const result = await updateProduct({ id: "prod-uuid", name: "Widget", price: 1500 });
		expect(result).toEqual(fakeProduct);
	});

	// Test case: updateProduct がエラーを返した場合に例外を投げる
	it("updateProduct throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateProduct({ id: "prod-uuid", price: 1500 })).rejects.toThrow("fail");
	});

	// Test case: deleteProduct が正常に実行され true を返す
	it("deleteProduct returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteProduct("prod-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteProduct がエラーを返した場合に例外を投げる
	it("deleteProduct throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteProduct("prod-uuid")).rejects.toThrow("fail");
	});
});
