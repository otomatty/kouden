/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createInventory } from "../createInventory";
import { listInventories } from "../listInventories";
import { getInventory } from "../getInventory";
import { updateInventory } from "../updateInventory";
import { deleteInventory } from "../deleteInventory";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("common inventory server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeItem = { id: "uuid", organization_id: "org", item: "Widget", stock_level: 5 };

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
		// biome-ignore lint/suspicious/noExplicitAny: casting to any for mocking
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	it("createInventory returns created item", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await createInventory({ organizationId: "org", item: "Widget", stockLevel: 5 });
		expect(result).toEqual(fakeItem);
	});

	it("createInventory throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createInventory({ organizationId: "org", item: "Widget", stockLevel: 5 }),
		).rejects.toThrow("fail");
	});

	it("listInventories returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeItem], error: null });
		const result = await listInventories();
		expect(result).toEqual([fakeItem]);
	});

	it("listInventories throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listInventories()).rejects.toThrow("fail");
	});

	it("getInventory returns item", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await getInventory("uuid");
		expect(result).toEqual(fakeItem);
	});

	it("getInventory throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getInventory("uuid")).rejects.toThrow("fail");
	});

	it("updateInventory returns updated item", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeItem, error: null });
		const result = await updateInventory({ id: "uuid", stockLevel: 10 });
		expect(result).toEqual(fakeItem);
	});

	it("deleteInventory returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteInventory("uuid");
		expect(result).toBe(true);
	});

	it("deleteInventory throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteInventory("uuid")).rejects.toThrow("fail");
	});
});
