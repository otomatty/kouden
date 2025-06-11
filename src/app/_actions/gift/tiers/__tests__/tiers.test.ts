/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createTier } from "../createTier";
import { listTiers } from "../listTiers";
import { getTier } from "../getTier";
import { updateTier } from "../updateTier";
import { deleteTier } from "../deleteTier";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift tiers server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeTier = {
		id: "tier-uuid",
		organization_id: "org",
		name: "Gold",
		threshold: 1000,
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

	// Test case: createTier が正常に実行され、作成されたティアを返す
	it("createTier returns created tier", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTier, error: null });
		const result = await createTier({
			organizationId: "org",
			name: "Gold",
			threshold: 1000,
		});
		expect(result).toEqual(fakeTier);
	});

	// Test case: createTier がエラーを返した場合に例外を投げる
	it("createTier throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createTier({ organizationId: "org", name: "Gold", threshold: 1000 }),
		).rejects.toThrow("fail");
	});

	// Test case: listTiers が配列を返す
	it("listTiers returns array of tiers", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeTier], error: null });
		const result = await listTiers();
		expect(result).toEqual([fakeTier]);
	});

	// Test case: listTiers がエラーを返した場合に例外を投げる
	it("listTiers throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listTiers()).rejects.toThrow("fail");
	});

	// Test case: getTier が正常にティアを返す
	it("getTier returns tier", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeTier, error: null });
		const result = await getTier("tier-uuid");
		expect(result).toEqual(fakeTier);
	});

	// Test case: getTier がエラーを返した場合に例外を投げる
	it("getTier throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getTier("tier-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateTier が正常に更新されたティアを返す
	it("updateTier returns updated tier", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTier, error: null });
		const result = await updateTier({ id: "tier-uuid", threshold: 2000 });
		expect(result).toEqual(fakeTier);
	});

	// Test case: updateTier がエラーを返した場合に例外を投げる
	it("updateTier throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateTier({ id: "tier-uuid", name: "Silver" })).rejects.toThrow("fail");
	});

	// Test case: deleteTier が正常に実行され true を返す
	it("deleteTier returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteTier("tier-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteTier がエラーを返した場合に例外を投げる
	it("deleteTier throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteTier("tier-uuid")).rejects.toThrow("fail");
	});
});
