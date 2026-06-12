/// <reference types="vitest" />
import { ErrorCodes } from "@/lib/errors";
import { validateFileUpload } from "@/lib/security/file-upload-validation";
import { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createContactRequest } from "../contact";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/security/file-upload-validation", () => ({
	validateFileUpload: vi.fn(),
}));

const REQUEST_ID = "request-new";

interface CreateContactSupabaseMockOptions {
	insertRequestError?: unknown;
	insertAttachmentError?: unknown;
	removeError?: unknown;
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
	const requestSingleMock = vi.fn().mockResolvedValue({
		data: { id: REQUEST_ID },
		error: options.insertRequestError ?? null,
	});
	const requestInsertMock = vi.fn().mockReturnValue({
		select: vi.fn().mockReturnValue({ single: requestSingleMock }),
	});

	const supabase = {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
		},
		from: vi.fn((table: string) => {
			if (table === "contact_requests") {
				return { insert: requestInsertMock };
			}
			return { insert: attachmentInsertMock };
		}),
		storage: {
			from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
		},
	};

	return {
		supabase,
		requestInsertMock,
		uploadMock,
		attachmentInsertMock,
		removeMock,
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

	it("添付なしの場合は問い合わせのみ作成する", async () => {
		const { supabase, uploadMock, attachmentInsertMock } = buildCreateContactSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await createContactRequest(buildFormData(false));

		expect(result.ok).toBe(true);
		expect(uploadMock).not.toHaveBeenCalled();
		expect(attachmentInsertMock).not.toHaveBeenCalled();
	});

	it("添付ありの場合は問い合わせ作成後に Storage へアップロードする", async () => {
		const { supabase, uploadMock, attachmentInsertMock } = buildCreateContactSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(true);
		expect(uploadMock).toHaveBeenCalledTimes(1);
		expect(attachmentInsertMock).toHaveBeenCalledTimes(1);
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

	it("添付の DB INSERT 失敗時は Storage 上のファイルを削除する", async () => {
		const { supabase, removeMock } = buildCreateContactSupabaseMock({
			insertAttachmentError: { message: "insert boom", code: "23505" },
		});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await createContactRequest(buildFormData(true));

		expect(result.ok).toBe(false);
		expect(removeMock).toHaveBeenCalledTimes(1);
		const removedPaths = removeMock.mock.calls[0]?.[0];
		expect(Array.isArray(removedPaths)).toBe(true);
		expect(removedPaths[0]).toContain(`requests/${REQUEST_ID}/`);
	});
});
