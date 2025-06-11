/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createSupportTicket } from "../createSupportTicket";
import { listSupportTickets } from "../listSupportTickets";
import { getSupportTicket } from "../getSupportTicket";
import { updateSupportTicket } from "../updateSupportTicket";
import { deleteSupportTicket } from "../deleteSupportTicket";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("gift support_tickets server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeTicket = {
		id: "ticket-uuid",
		organization_id: "org",
		customer_id: "cust-uuid",
		subject: "Help",
		message: "Issue",
		status: "open",
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

	// Test case: createSupportTicket が正常に実行され、作成されたチケットを返す
	it("createSupportTicket returns created ticket", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTicket, error: null });
		const result = await createSupportTicket({
			organizationId: "org",
			customerId: "cust-uuid",
			subject: "Help",
			message: "Issue",
			status: "open",
		});
		expect(result).toEqual(fakeTicket);
	});

	// Test case: createSupportTicket がエラーを返した場合に例外を投げる
	it("createSupportTicket throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createSupportTicket({
				organizationId: "org",
				customerId: "cust-uuid",
				subject: "Help",
				message: "Issue",
			}),
		).rejects.toThrow("fail");
	});

	// Test case: listSupportTickets が配列を返す
	it("listSupportTickets returns array of tickets", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeTicket], error: null });
		const result = await listSupportTickets();
		expect(result).toEqual([fakeTicket]);
	});

	// Test case: listSupportTickets がエラーを返した場合に例外を投げる
	it("listSupportTickets throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listSupportTickets()).rejects.toThrow("fail");
	});

	// Test case: getSupportTicket が正常にチケットを返す
	it("getSupportTicket returns ticket", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeTicket, error: null });
		const result = await getSupportTicket("ticket-uuid");
		expect(result).toEqual(fakeTicket);
	});

	// Test case: getSupportTicket がエラーを返した場合に例外を投げる
	it("getSupportTicket throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getSupportTicket("ticket-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateSupportTicket が正常に更新されたチケットを返す
	it("updateSupportTicket returns updated ticket", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTicket, error: null });
		const result = await updateSupportTicket({ id: "ticket-uuid", status: "closed" });
		expect(result).toEqual(fakeTicket);
	});

	// Test case: updateSupportTicket がエラーを返した場合に例外を投げる
	it("updateSupportTicket throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateSupportTicket({ id: "ticket-uuid", subject: "Update" })).rejects.toThrow(
			"fail",
		);
	});

	// Test case: deleteSupportTicket が正常に実行され true を返す
	it("deleteSupportTicket returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteSupportTicket("ticket-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteSupportTicket がエラーを返した場合に例外を投げる
	it("deleteSupportTicket throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteSupportTicket("ticket-uuid")).rejects.toThrow("fail");
	});
});
