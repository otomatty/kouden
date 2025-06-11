/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "../createCustomer";
import { listCustomers } from "../listCustomers";
import { getCustomer } from "../getCustomer";
import { updateCustomer } from "../updateCustomer";
import { deleteCustomer } from "../deleteCustomer";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("common customers server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeCustomer = {
		id: "uuid",
		name: "Alice",
		email: "alice@example.com",
		phone: "123-456-7890",
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

	it("createCustomer returns created customer", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCustomer, error: null });
		const result = await createCustomer({
			name: "Alice",
			email: "alice@example.com",
			phone: "123-456-7890",
			organizationId: "org",
		});
		expect(result).toEqual(fakeCustomer);
	});

	it("createCustomer throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createCustomer({
				name: "Alice",
				email: "alice@example.com",
				phone: "123-456-7890",
				organizationId: "org",
			}),
		).rejects.toThrow("fail");
	});

	it("listCustomers returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeCustomer], error: null });
		const result = await listCustomers();
		expect(result).toEqual([fakeCustomer]);
	});

	it("listCustomers throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listCustomers()).rejects.toThrow("fail");
	});

	it("getCustomer returns customer", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeCustomer, error: null });
		const result = await getCustomer("uuid");
		expect(result).toEqual(fakeCustomer);
	});

	it("getCustomer throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getCustomer("uuid")).rejects.toThrow("fail");
	});

	it("updateCustomer returns updated customer", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeCustomer, error: null });
		const result = await updateCustomer({
			id: "uuid",
			name: "Alice",
			email: "alice@example.com",
			phone: "123-456-7890",
		});
		expect(result).toEqual(fakeCustomer);
	});

	it("updateCustomer throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			updateCustomer({
				id: "uuid",
				name: "Alice",
				email: "alice@example.com",
				phone: "123-456-7890",
			}),
		).rejects.toThrow("fail");
	});

	it("deleteCustomer returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteCustomer("uuid");
		expect(result).toBe(true);
	});

	it("deleteCustomer throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteCustomer("uuid")).rejects.toThrow("fail");
	});
});
