import { createClient } from "@/lib/supabase/server";
/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMaterialOrder } from "../createMaterialOrder";
import { deleteMaterialOrder } from "../deleteMaterialOrder";
import { getMaterialOrder } from "../getMaterialOrder";
import { listMaterialOrders } from "../listMaterialOrders";
import { updateMaterialOrder } from "../updateMaterialOrder";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral material orders server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeOrder = {
		id: "uuid",
		organization_id: "org",
		case_id: "case123",
		item: "Casket",
		quantity: 2,
		order_date: "2023-01-01",
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

	it("createMaterialOrder returns created order", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await createMaterialOrder({
			organizationId: "org",
			caseId: "case123",
			item: "Casket",
			quantity: 2,
			orderDate: "2023-01-01",
			status: "pending",
		});
		expect(result).toEqual(fakeOrder);
	});

	it("createMaterialOrder throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createMaterialOrder({
				organizationId: "org",
				caseId: "case123",
				item: "Casket",
				quantity: 2,
			}),
		).rejects.toThrow("fail");
	});

	it("listMaterialOrders returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeOrder], error: null });
		const result = await listMaterialOrders();
		expect(result).toEqual([fakeOrder]);
	});

	it("listMaterialOrders throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listMaterialOrders()).rejects.toThrow("fail");
	});

	it("getMaterialOrder returns order", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await getMaterialOrder("uuid");
		expect(result).toEqual(fakeOrder);
	});

	it("getMaterialOrder throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getMaterialOrder("uuid")).rejects.toThrow("fail");
	});

	it("updateMaterialOrder returns updated order", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeOrder, error: null });
		const result = await updateMaterialOrder({ id: "uuid", quantity: 5 });
		expect(result).toEqual(fakeOrder);
	});

	it("updateMaterialOrder throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateMaterialOrder({ id: "uuid", quantity: 5 })).rejects.toThrow("fail");
	});

	it("deleteMaterialOrder returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteMaterialOrder("uuid");
		expect(result).toBe(true);
	});

	it("deleteMaterialOrder throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteMaterialOrder("uuid")).rejects.toThrow("fail");
	});
});
