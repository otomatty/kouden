import PDFDocument from "pdfkit";
import { Resend } from "resend";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { exportReceiptToPdf } from "../exportReceipt";

// モック設定
vi.mock("pdfkit");
vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));
vi.mock("resend");

function createPdfDocMockImplementation() {
	return () => {
		const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
		return {
			registerFont: vi.fn().mockReturnThis(),
			font: vi.fn().mockReturnThis(),
			fontSize: vi.fn().mockReturnThis(),
			text: vi.fn().mockReturnThis(),
			moveDown: vi.fn().mockReturnThis(),
			end: vi.fn().mockImplementation(() => {
				setImmediate(() => {
					for (const cb of listeners.end || []) cb();
				});
			}),
			on: vi.fn().mockImplementation(function (
				this: unknown,
				event: string,
				cb: (...args: unknown[]) => void,
			) {
				if (!listeners[event]) listeners[event] = [];
				listeners[event].push(cb);
				return this;
			}),
		};
	};
}

// Set RESEND_API_KEY for tests to prevent missing env errors
vi.stubEnv("RESEND_API_KEY", "test_key");

describe("exportReceiptToPdf", () => {
	// biome-ignore lint/suspicious/noExplicitAny: test mock requires flexible typing
	let supabaseMock: any;
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
		vi.clearAllMocks();
		// Re-apply mock implementations after clearAllMocks
		(PDFDocument as unknown as Mock).mockImplementation(createPdfDocMockImplementation());
		(Resend as unknown as Mock).mockImplementation(() => ({
			emails: {
				send: vi.fn().mockResolvedValue({}),
			},
		}));
		// Supabase Admin Client のモックセットアップ
		supabaseMock = {
			from: vi
				.fn()
				// purchase
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockPurchase, error: null }) }),
					}),
				})
				// plan
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockPlan, error: null }) }),
					}),
				})
				// kouden
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: mockKouden, error: null }) }),
					}),
				})
				// notification_types select
				.mockReturnValueOnce({
					select: () => ({
						eq: () => ({ single: () => Promise.resolve({ data: { id: "nt1" }, error: null }) }),
					}),
				})
				// notifications insert
				.mockReturnValueOnce({
					insert: () => ({ single: () => Promise.resolve({ error: null }) }),
				}),
			auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: mockUser, error: null }) } },
			storage: {
				from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) }),
			},
		};
		(createAdminClient as unknown as Mock).mockReturnValue(supabaseMock);
	});

	it("should create PDFDocument with correct options", async () => {
		await exportReceiptToPdf("1");
		expect(PDFDocument).toHaveBeenCalledWith({ size: "A4", margin: 50 });
	});

	it("should upload PDF to storage", async () => {
		await exportReceiptToPdf("1");
		expect(supabaseMock.storage.from).toHaveBeenCalledWith("receipts");
		expect(supabaseMock.storage.from().upload).toHaveBeenCalledWith(
			"receipts/1.pdf",
			expect.any(Buffer),
			{ contentType: "application/pdf", upsert: false },
		);
	});

	it("should send email with attachment", async () => {
		await exportReceiptToPdf("1");
		// @ts-expect-error: mock is guaranteed by vi.mock
		const resendInstance = (Resend as unknown as Mock).mock.results[0].value;
		expect(resendInstance.emails.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "test@example.com",
				attachments: expect.any(Array),
			}),
		);
	});

	it("should throw error when purchase not found", async () => {
		// 購入情報取得失敗をシミュレート
		(createAdminClient as unknown as Mock).mockReturnValue({
			from: vi.fn().mockReturnValue({
				select: () => ({
					eq: () => ({ single: () => Promise.resolve({ data: null, error: {} }) }),
				}),
			}),
		});
		await expect(exportReceiptToPdf("invalid")).rejects.toThrow("購入情報の取得に失敗しました");
	});
});
