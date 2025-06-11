/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createPromotion } from "../createPromotion";
import { listPromotions } from "../listPromotions";
import { getPromotion } from "../getPromotion";
import { updatePromotion } from "../updatePromotion";
import { deletePromotion } from "../deletePromotion";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift promotions server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakePromotion = {
		id: "promo-uuid",
		organization_id: "org",
		code: "SAVE10",
		discount_type: "percentage",
		discount_value: 10,
		expires_at: "2025-01-01T00:00:00Z",
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

	// Test case: createPromotion が正常に実行され、作成されたプロモーションを返す
	it("createPromotion returns created promotion", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePromotion, error: null });
		const result = await createPromotion({
			organizationId: "org",
			code: "SAVE10",
			discountType: "percentage",
			discountValue: 10,
			expiresAt: "2025-01-01T00:00:00Z",
		});
		expect(result).toEqual(fakePromotion);
	});

	// Test case: createPromotion がエラーを返した場合に例外を投げる
	it("createPromotion throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(createPromotion({ organizationId: "org", code: "SAVE10" })).rejects.toThrow(
			"fail",
		);
	});

	// Test case: listPromotions が配列を返す
	it("listPromotions returns array of promotions", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakePromotion], error: null });
		const result = await listPromotions();
		expect(result).toEqual([fakePromotion]);
	});

	// Test case: listPromotions がエラーを返した場合に例外を投げる
	it("listPromotions throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listPromotions()).rejects.toThrow("fail");
	});

	// Test case: getPromotion が正常にプロモーションを返す
	it("getPromotion returns promotion", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakePromotion, error: null });
		const result = await getPromotion("promo-uuid");
		expect(result).toEqual(fakePromotion);
	});

	// Test case: getPromotion がエラーを返した場合に例外を投げる
	it("getPromotion throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getPromotion("promo-uuid")).rejects.toThrow("fail");
	});

	// Test case: updatePromotion が正常に更新されたプロモーションを返す
	it("updatePromotion returns updated promotion", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakePromotion, error: null });
		const result = await updatePromotion({ id: "promo-uuid", code: "SAVE20" });
		expect(result).toEqual(fakePromotion);
	});

	// Test case: updatePromotion がエラーを返した場合に例外を投げる
	it("updatePromotion throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updatePromotion({ id: "promo-uuid", discountValue: 20 })).rejects.toThrow("fail");
	});

	// Test case: deletePromotion が正常に実行され true を返す
	it("deletePromotion returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deletePromotion("promo-uuid");
		expect(result).toBe(true);
	});

	// Test case: deletePromotion がエラーを返した場合に例外を投げる
	it("deletePromotion throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deletePromotion("promo-uuid")).rejects.toThrow("fail");
	});
});
