import { ErrorCodes } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { exportReceiptToPdf } from "../exportReceipt";

vi.mock("pdfkit", () => ({
	__esModule: true,
	default: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

vi.mock("resend", () => ({
	Resend: vi.fn(),
}));

vi.stubEnv("RESEND_API_KEY", "test_key");

describe("exportReceiptToPdf", () => {
	// biome-ignore lint/suspicious/noExplicitAny: supabase mock
	let supabaseMock: any;
	let resendSendMock: ReturnType<typeof vi.fn>;
	let storageUploadMock: ReturnType<typeof vi.fn>;

	const mockPurchase = {
		id: "1",
		kouden_id: "k1",
		plan_id: "p1",
		user_id: "u1",
		amount_paid: 1000,
		purchased_at: new Date().toISOString(),
		stripe_session_id: "s1",
	};
	const mockPlan = { name: "Basic" };
	const mockKouden = { title: "My Kouden" };
	const mockUser = { user: { email: "test@example.com" } };

	beforeEach(() => {
		// vitest config has mockReset/restoreMocks: true, so implementations set inside
		// vi.mock() factories are wiped between tests. Re-set them here.
		// Vitest 4 invokes a mock with `new` as a real constructor, so the
		// implementation must be a constructable (non-arrow) function.
		// biome-ignore lint/complexity/useArrowFunction: must stay constructable for `new`
		(PDFDocument as unknown as Mock).mockImplementation(function () {
			return {
				fontSize: vi.fn().mockReturnThis(),
				text: vi.fn().mockReturnThis(),
				moveDown: vi.fn().mockReturnThis(),
				end: vi.fn(),
				on: vi.fn((event: string, cb: () => void) => {
					if (event === "end") setImmediate(cb);
				}),
			};
		});

		resendSendMock = vi.fn().mockResolvedValue({});
		// biome-ignore lint/complexity/useArrowFunction: must stay constructable for `new`
		(Resend as unknown as Mock).mockImplementation(function () {
			return { emails: { send: resendSendMock } };
		});

		storageUploadMock = vi.fn().mockResolvedValue({ error: null });
		supabaseMock = {
			from: vi.fn((table: string) => {
				switch (table) {
					case "kouden_purchases":
						return {
							select: () => ({
								eq: () => ({
									single: () => Promise.resolve({ data: mockPurchase, error: null }),
								}),
							}),
						};
					case "plans":
						return {
							select: () => ({
								eq: () => ({
									single: () => Promise.resolve({ data: mockPlan, error: null }),
								}),
							}),
						};
					case "koudens":
						return {
							select: () => ({
								eq: () => ({
									single: () => Promise.resolve({ data: mockKouden, error: null }),
								}),
							}),
						};
					case "notification_types":
						return {
							select: () => ({
								eq: () => ({
									single: () => Promise.resolve({ data: { id: "nt1" }, error: null }),
								}),
							}),
						};
					case "notifications":
						return {
							insert: () => Promise.resolve({ error: null }),
						};
					default:
						throw new Error(`Unexpected table: ${table}`);
				}
			}),
			auth: {
				admin: {
					getUserById: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
				},
			},
			storage: {
				from: vi.fn().mockReturnValue({ upload: storageUploadMock }),
			},
		};
		(createAdminClient as unknown as Mock).mockReturnValue(supabaseMock);
	});

	it("should create PDFDocument with correct options", async () => {
		const result = await exportReceiptToPdf("1");
		expect(result.ok).toBe(true);
		expect(PDFDocument).toHaveBeenCalledWith({ size: "A4", margin: 50 });
	});

	it("should upload PDF to storage", async () => {
		const result = await exportReceiptToPdf("1");
		expect(result.ok).toBe(true);
		expect(supabaseMock.storage.from).toHaveBeenCalledWith("receipts");
		expect(storageUploadMock).toHaveBeenCalledWith("receipts/1.pdf", expect.any(Buffer), {
			contentType: "application/pdf",
			upsert: false,
		});
	});

	it("should send email with attachment", async () => {
		const result = await exportReceiptToPdf("1");
		expect(result.ok).toBe(true);
		expect(resendSendMock).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "test@example.com",
				attachments: expect.any(Array),
			}),
		);
	});

	it("should return NOT_FOUND when purchase not found", async () => {
		supabaseMock.from.mockImplementationOnce(() => ({
			select: () => ({
				eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
			}),
		}));
		const result = await exportReceiptToPdf("invalid");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.NOT_FOUND);
		}
	});
});
