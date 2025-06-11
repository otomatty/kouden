/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { recordDonation } from "../recordDonation";
import { listDonations } from "../listDonations";
import { getDonation } from "../getDonation";
import { updateDonation } from "../updateDonation";
import { deleteDonation } from "../deleteDonation";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral donations server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeDonation = {
		id: "don-uuid",
		organization_id: "org",
		case_id: "case-uuid",
		donor_name: "Bob",
		amount: 100,
		donated_at: "2025-05-05T15:00:00Z",
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

	// Test case: recordDonation が正常に実行され、記録された寄付を返す
	it("recordDonation returns created donation", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeDonation, error: null });
		const result = await recordDonation({
			organizationId: "org",
			caseId: "case-uuid",
			donorName: "Bob",
			amount: 100,
			receivedAt: "2025-05-05T15:00:00Z",
		});
		expect(result).toEqual(fakeDonation);
	});

	// Test case: recordDonation がエラーを返した場合に例外を投げる
	it("recordDonation throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			recordDonation({ organizationId: "org", caseId: "case-uuid", donorName: "Bob", amount: 100 }),
		).rejects.toThrow("fail");
	});

	// Test case: listDonations が正常に配列を返す
	it("listDonations returns array of donations", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeDonation], error: null });
		const result = await listDonations("case-uuid");
		expect(result).toEqual([fakeDonation]);
	});

	// Test case: listDonations がエラーを返した場合に例外を投げる
	it("listDonations throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listDonations("case-uuid")).rejects.toThrow("fail");
	});

	// Test case: getDonation が正常に寄付を返す
	it("getDonation returns donation", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeDonation, error: null });
		const result = await getDonation("don-uuid");
		expect(result).toEqual(fakeDonation);
	});

	// Test case: getDonation がエラーを返した場合に例外を投げる
	it("getDonation throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getDonation("don-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateDonation が正常に更新された寄付を返す
	it("updateDonation returns updated donation", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeDonation, error: null });
		const result = await updateDonation({ id: "don-uuid", amount: 150 });
		expect(result).toEqual(fakeDonation);
	});

	// Test case: updateDonation がエラーを返した場合に例外を投げる
	it("updateDonation throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateDonation({ id: "don-uuid", donorName: "Alice" })).rejects.toThrow("fail");
	});

	// Test case: deleteDonation が正常に実行され true を返す
	it("deleteDonation returns true", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteDonation("don-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteDonation がエラーを返した場合に例外を投げる
	it("deleteDonation throws on error", async () => {
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteDonation("don-uuid")).rejects.toThrow("fail");
	});
});
