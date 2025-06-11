/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createReservation } from "../createReservation";
import { listReservations } from "../listReservations";
import { getReservation } from "../getReservation";
import { updateReservation } from "../updateReservation";
import { deleteReservation } from "../deleteReservation";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral reservations server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeReservation = {
		id: "uuid",
		organization_id: "org",
		customer_id: "cust-uuid",
		date: "2023-01-01",
		status: "confirmed",
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

	it("createReservation returns created reservation", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeReservation, error: null });
		const result = await createReservation({
			organizationId: "org",
			customerId: "cust-uuid",
			date: "2023-01-01",
			status: "confirmed",
		});
		expect(result).toEqual(fakeReservation);
	});

	it("createReservation throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createReservation({
				organizationId: "org",
				customerId: "cust-uuid",
				date: "2023-01-01",
			}),
		).rejects.toThrow("fail");
	});

	it("listReservations returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeReservation], error: null });
		const result = await listReservations();
		expect(result).toEqual([fakeReservation]);
	});

	it("listReservations throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listReservations()).rejects.toThrow("fail");
	});

	it("getReservation returns reservation", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeReservation, error: null });
		const result = await getReservation("uuid");
		expect(result).toEqual(fakeReservation);
	});

	it("getReservation throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getReservation("uuid")).rejects.toThrow("fail");
	});

	it("updateReservation returns updated reservation", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeReservation, error: null });
		const result = await updateReservation({ id: "uuid", status: "cancelled" });
		expect(result).toEqual(fakeReservation);
	});

	it("updateReservation throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateReservation({ id: "uuid", status: "cancelled" })).rejects.toThrow("fail");
	});

	it("deleteReservation returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteReservation("uuid");
		expect(result).toBe(true);
	});

	it("deleteReservation throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteReservation("uuid")).rejects.toThrow("fail");
	});
});
