/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { addAttendee } from "../addAttendee";
import { listAttendees } from "../listAttendees";
import { getAttendee } from "../getAttendee";
import { updateAttendee } from "../updateAttendee";
import { deleteAttendee } from "../deleteAttendee";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral attendees server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeAttendee = {
		id: "att-uuid",
		organization_id: "org",
		case_id: "case-uuid",
		name: "Alice",
		relation: "friend",
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

	// Test case: addAttendee が正常に実行され、作成された出席者を返す
	it("addAttendee returns created attendee", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeAttendee, error: null });
		const result = await addAttendee({
			organizationId: "org",
			caseId: "case-uuid",
			name: "Alice",
			relation: "friend",
			status: "confirmed",
		});
		expect(result).toEqual(fakeAttendee);
	});

	// Test case: addAttendee がエラーを返した場合に例外を投げる
	it("addAttendee throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			addAttendee({ organizationId: "org", caseId: "case-uuid", name: "Alice" }),
		).rejects.toThrow("fail");
	});

	// Test case: listAttendees が正常に配列を返す
	it("listAttendees returns array of attendees", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: [fakeAttendee], error: null });
		const result = await listAttendees("case-uuid");
		expect(result).toEqual([fakeAttendee]);
	});

	// Test case: listAttendees がエラーを返した場合に例外を投げる
	it("listAttendees throws on error", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.eq.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listAttendees("case-uuid")).rejects.toThrow("fail");
	});

	// Test case: getAttendee が正常に出席者を返す
	it("getAttendee returns attendee", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeAttendee, error: null });
		const result = await getAttendee("att-uuid");
		expect(result).toEqual(fakeAttendee);
	});

	// Test case: getAttendee がエラーを返した場合に例外を投げる
	it("getAttendee throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getAttendee("att-uuid")).rejects.toThrow("fail");
	});

	// Test case: updateAttendee が正常に更新された出席者を返す
	it("updateAttendee returns updated attendee", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeAttendee, error: null });
		const result = await updateAttendee({ id: "att-uuid", name: "Bob" });
		expect(result).toEqual(fakeAttendee);
	});

	// Test case: updateAttendee がエラーを返した場合に例外を投げる
	it("updateAttendee throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateAttendee({ id: "att-uuid", status: "pending" })).rejects.toThrow("fail");
	});

	// Test case: deleteAttendee が正常に実行され true を返す
	it("deleteAttendee returns true", async () => {
		// eq() を実行し、エラーがない場合をシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: null });
		const result = await deleteAttendee("att-uuid");
		expect(result).toBe(true);
	});

	// Test case: deleteAttendee がエラーを返した場合に例外を投げる
	it("deleteAttendee throws on error", async () => {
		// eq() を実行し、エラーをシミュレート
		supabaseMock.eq = vi.fn().mockResolvedValueOnce({ error: new Error("fail") });
		await expect(deleteAttendee("att-uuid")).rejects.toThrow("fail");
	});
});
