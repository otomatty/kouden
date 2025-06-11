/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createLoyaltyPoint } from "../createLoyaltyPoint";
import { listLoyaltyPoints } from "../listLoyaltyPoints";
import { getLoyaltyPoint } from "../getLoyaltyPoint";
import { updateLoyaltyPoint } from "../updateLoyaltyPoint";
import { deleteLoyaltyPoint } from "../deleteLoyaltyPoint";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift loyalty_points server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakePoint = {
		id: "lp-uuid",
		organization_id: "org",
		customer_id: "cust-uuid",
		points: 100,
		created_at: "2025-08-08T00:00:00Z",
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

	// Test case: createLoyaltyPoint が正常に実行され、作成されたポイントを返す
	it("createLoyaltyPoint returns created point", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePoint, error: null });
		const result = await createLoyaltyPoint({
			organizationId: "org",
			customerId: "cust-uuid",
			points: 100,
		});
		expect(result).toEqual(fakePoint);
	});

	// Test case: createLoyaltyPoint がエラーを返した場合に例外を投げる
	it("createLoyaltyPoint throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createLoyaltyPoint({ organizationId: "org", customerId: "cust-uuid", points: 100 }),
		).rejects.toThrow("fail");
	});

	// Test case: listLoyaltyPoints が配列を返す
	it("listLoyaltyPoints returns array of points", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakePoint], error: null });
		const result = await listLoyaltyPoints();
		expect(result).toEqual([fakePoint]);
	});

	// Test case: listLoyaltyPoints がエラーを返した場合に例外を投げる
	it("listLoyaltyPoints throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listLoyaltyPoints()).rejects.toThrow("fail");
	});

	// Test case: getLoyaltyPoint が正常にポイントを返す
	it("getLoyaltyPoint returns point", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakePoint, error: null });
		const result = await getLoyaltyPoint("lp-uuid");
		expect(result).toEqual(fakePoint);
	});

	// Test case: getLoyaltyPoint がエラーを返した場合に例外を投げる
	it("getLoyaltyPoint throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getLoyaltyPoint("lp-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateLoyaltyPoint が正常に更新されたポイントを返す
	it("updateLoyaltyPoint returns updated point", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePoint, error: null });
		const result = await updateLoyaltyPoint({ id: "lp-uuid", points: 150 });
		expect(result).toEqual(fakePoint);
	});

	// Test case: updateLoyaltyPoint がエラーを返した場合に例外を投げる
	it("updateLoyaltyPoint throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateLoyaltyPoint({ id: "lp-uuid", points: 150 })).rejects.toThrow("fail");
	});

	// Test case: deleteLoyaltyPoint が正常に実行され true を返す
	it("deleteLoyaltyPoint returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteLoyaltyPoint("lp-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteLoyaltyPoint がエラーを返した場合に例外を投げる
	it("deleteLoyaltyPoint throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteLoyaltyPoint("lp-uuid")).rejects.toThrow("fail");
	});
});
