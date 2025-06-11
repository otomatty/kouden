/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createContact } from "../createContact";
import { listContacts } from "../listContacts";
import { getContact } from "../getContact";
import { updateContact } from "../updateContact";
import { deleteContact } from "../deleteContact";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral contacts server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeContact = {
		id: "contact-uuid",
		organization_id: "org",
		customer_id: "cust-uuid",
		type: "email",
		template: "template-id",
		last_sent_at: "2025-03-03T12:00:00Z",
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

	// Test case: createContact が正常に実行され、作成されたコンタクトを返す
	it("createContact returns created contact", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeContact, error: null });
		const result = await createContact({
			organizationId: "org",
			customerId: "cust-uuid",
			type: "email",
			template: "template-id",
			lastSentAt: "2025-03-03T12:00:00Z",
		});
		expect(result).toEqual(fakeContact);
	});

	// Test case: createContact がエラーを返した場合に例外を投げる
	it("createContact throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createContact({
				organizationId: "org",
				customerId: "cust-uuid",
				type: "email",
				template: "template-id",
			}),
		).rejects.toThrow("fail");
	});

	// Test case: listContacts が正常に配列を返す
	it("listContacts returns array of contacts", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeContact], error: null });
		const result = await listContacts("cust-uuid");
		expect(result).toEqual([fakeContact]);
	});

	// Test case: listContacts がエラーを返した場合に例外を投げる
	it("listContacts throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listContacts("cust-uuid")).rejects.toThrow("fail");
	});

	// Test case: getContact が正常にコンタクトを返す
	it("getContact returns contact", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeContact, error: null });
		const result = await getContact("contact-uuid");
		expect(result).toEqual(fakeContact);
	});

	// Test case: getContact がエラーを返した場合に例外を投げる
	it("getContact throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getContact("contact-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateContact が正常に更新されたコンタクトを返す
	it("updateContact returns updated contact", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeContact, error: null });
		const result = await updateContact({
			id: "contact-uuid",
			type: "sms",
			template: "tmpl",
			lastSentAt: "2025-04-04T12:00:00Z",
		});
		expect(result).toEqual(fakeContact);
	});

	// Test case: updateContact がエラーを返した場合に例外を投げる
	it("updateContact throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateContact({ id: "contact-uuid", template: "tmpl" })).rejects.toThrow("fail");
	});

	// Test case: deleteContact が正常に実行され true を返す
	it("deleteContact returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteContact("contact-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteContact がエラーを返した場合に例外を投げる
	it("deleteContact throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteContact("contact-uuid")).rejects.toThrow("fail");
	});
});
