/// <reference types="vitest" />
import { ErrorCodes } from "@/lib/errors";
import { validateFileUpload } from "@/lib/security/file-upload-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createContactRequest } from "../contact";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
	createAdminClient: vi.fn(),
}));

vi.mock("@/lib/security/file-upload-validation", () => ({
	validateFileUpload: vi.fn(),
}));

interface CreateContactSupabaseMockOptions {
	insertRequestError?: unknown;
	insertAttachmentError?: unknown;
	removeError?: unknown;
	rollbackDeleteError?: unknown;
}

function buildCreateContactSupabaseMock(options: CreateContactSupabaseMockOptions = {}) {
	const removeMock = vi.fn().mockResolvedValue({ error: options.removeError ?? null });
	const uploadMock = vi.fn().mockResolvedValue({ error: null });
	const selectInsertMock = vi
		.fn()
		.mockResolvedValue(
			options.insertAttachmentError
				? { data: null, error: options.insertAttachmentError }
				: { data: [{ id: "att-1" }], error: null },
		);
	const attachmentInsertMock = vi.fn().mockReturnValue({ select: selectInsertMock });
	const requestInsertMock = vi.fn().mockResolvedValue({ error: options.insertRequestError ?? null });
	const requestDeleteEqMock = vi
		.fn()
		.mockResolvedValue({ error: options.rollbackDeleteError ?? null });
	const requestDeleteMock = vi.fn().mockReturnValue({ eq: requestDeleteEqMock });

	const supabase = {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
		},
		from: vi.fn((table: string) => {
			if (table === "contact_requests") {
				return {
					insert: requestInsertMock,
					delete: requestDeleteMock,
				};
			}
			return { insert: attachmentInsertMock };
		}),
		storage: {
			from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
		},
	};

	const adminSupabase = {
		from: vi.fn((table: string) => {
			if (table === "contact_requests") {
				return { delete: requestDeleteMock };
			}
			return { insert: attachmentInsertMock };
		}),
		storage: {
			from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
		},
	};

	return {
		supabase,
		adminSupabase,
		requestInsertMock,
		uploadMock,
		attachmentInsertMock,
		removeMock,
		requestDeleteEqMock,
	};
}

function buildFormData(withAttachment = false): FormData {
	const formData = new FormData();
	formData.append("category", "support");
	formData.append("email", "user@example.com");
	formData.append("message", "テスト問い合わせ");
	if (withAttachment) {
		formData.append(
			"attachment",
			new File(["hello"], "report.pdf", { type: "application/pdf" }),
			"report.pdf",
		);
	}
	return formData;
}

describe("createContactRequest", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(validateFileUpload).mockResolvedValue({ isValid: true });
	});

	it("添付なしの場合は問い合わせのみ作成し select を使わない", async () => {
		const { supabase, requestInsertMock, uploadMock, attachmentInsertMock } =
			buildCreateContactSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await createContactRequest(buildFormData(false));

		expect(result.ok).toBe(true);
		expect(requestInsertMock).toHaveBeenCalledTimes(1);
		expect(requestInsertMock.mock.calls[0]?.[0]).not.toHaveProperty("id");
		expect(uploadMock).not.toHaveBeenCalled();
		expect(attachmentInsertMock).not.toHaveBeenCalled();
		expect(createAdminClient).not.toHaveBeenCalled();
	});

	it("添付ありの場合は明示 ID で問い合わせを作成し Storage へアップロードする", async () => {
		const { supabase, adminSupabase, requestInsertMock, uploadMock, attachmentInsertMock } =
			buildCreateContactSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createAdminClient).mockReturnValue(adminSupabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(true);
		expect(requestInsertMock).toHaveBeenCalledTimes(1);
		const insertedPayload = requestInsertMock.mock.calls[0]?.[0] as { id?: string };
		expect(insertedPayload.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(uploadMock).toHaveBeenCalledTimes(1);
		expect(attachmentInsertMock).toHaveBeenCalledTimes(1);
		expect(createAdminClient).toHaveBeenCalled();
	});

	it("添付の検証失敗時は問い合わせを作成しない", async () => {
		vi.mocked(validateFileUpload).mockResolvedValue({
			isValid: false,
			error: "不正なファイルです",
		});
		const { supabase, requestInsertMock } = buildCreateContactSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
		}
		expect(requestInsertMock).not.toHaveBeenCalled();
	});

	it("添付の DB INSERT 失敗時は Storage 上のファイルを削除し問い合わせもロールバックする", async () => {
		const { supabase, adminSupabase, removeMock, requestDeleteEqMock, requestInsertMock } =
			buildCreateContactSupabaseMock({
				insertAttachmentError: { message: "insert boom", code: "23505" },
			});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createAdminClient).mockReturnValue(adminSupabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(false);
		expect(removeMock).toHaveBeenCalledTimes(1);
		const removedPaths = removeMock.mock.calls[0]?.[0];
		expect(Array.isArray(removedPaths)).toBe(true);
		const insertedPayload = requestInsertMock.mock.calls[0]?.[0] as { id: string };
		expect(removedPaths[0]).toContain(`requests/${insertedPayload.id}/`);
		expect(requestDeleteEqMock).toHaveBeenCalledWith("id", insertedPayload.id);
	});

	it("添付の DB INSERT 失敗時にロールバックも失敗しても元のエラーを返す", async () => {
		const { supabase, adminSupabase, removeMock, requestDeleteEqMock } =
			buildCreateContactSupabaseMock({
				insertAttachmentError: { message: "insert boom", code: "23505" },
				rollbackDeleteError: { message: "delete failed" },
			});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createAdminClient).mockReturnValue(adminSupabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.ALREADY_EXISTS);
		}
		expect(removeMock).toHaveBeenCalledTimes(1);
		expect(requestDeleteEqMock).toHaveBeenCalledTimes(1);
	});
});
