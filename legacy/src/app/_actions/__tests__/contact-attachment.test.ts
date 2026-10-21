/// <reference types="vitest" />
import { ErrorCodes } from "@/lib/errors";
import { validateFileUpload } from "@/lib/security/file-upload-validation";
import { createClient } from "@/lib/supabase/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadContactAttachment } from "../contact";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/lib/security/file-upload-validation", () => ({
	validateFileUpload: vi.fn(),
}));

const USER_ID = "user-1";
const REQUEST_ID = "request-1";

/**
 * uploadContactAttachment が依存する Supabase クライアントのモックを生成する。
 * - auth.getUser: 認証済みユーザーを返す
 * - from("contact_requests"): 所有者チェック (single) 用
 * - from("contact_request_attachments"): INSERT (insert().select()) 用
 * - storage.from("contact-attachments"): upload / remove 用
 */
interface SupabaseMockOptions {
	uploadError?: unknown;
	insertError?: unknown;
	removeError?: unknown;
}

function buildSupabaseMock(options: SupabaseMockOptions = {}) {
	const removeMock = vi.fn().mockResolvedValue({ error: options.removeError ?? null });
	const uploadMock = vi.fn().mockResolvedValue({ error: options.uploadError ?? null });
	const selectInsertMock = vi
		.fn()
		.mockResolvedValue(
			options.insertError
				? { data: null, error: options.insertError }
				: { data: [{ id: "att-1" }], error: null },
		);
	const insertMock = vi.fn().mockReturnValue({ select: selectInsertMock });

	const ownerSingleMock = vi.fn().mockResolvedValue({ data: { user_id: USER_ID }, error: null });

	const supabase = {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } } }),
		},
		from: vi.fn((table: string) => {
			if (table === "contact_requests") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({ single: ownerSingleMock }),
					}),
				};
			}
			// contact_request_attachments
			return { insert: insertMock };
		}),
		storage: {
			from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })),
		},
	};

	return { supabase, uploadMock, insertMock, selectInsertMock, removeMock };
}

describe("uploadContactAttachment", () => {
	const file = new File(["hello"], "report.pdf", { type: "application/pdf" });

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(validateFileUpload).mockResolvedValue({ isValid: true });
	});

	it("ファイル検証失敗時は VALIDATION_ERROR を返し upload/insert/remove を呼ばない", async () => {
		vi.mocked(validateFileUpload).mockResolvedValue({
			isValid: false,
			error: "不正なファイルです",
		});
		const { supabase, uploadMock, insertMock, removeMock } = buildSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await uploadContactAttachment(REQUEST_ID, file);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
		}
		// 検証で弾かれるため Storage / DB 操作は一切行わない
		expect(uploadMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
		expect(removeMock).not.toHaveBeenCalled();
	});

	it("INSERT 失敗時にアップロード済みファイルを削除して孤児ファイルを残さない", async () => {
		const { supabase, removeMock } = buildSupabaseMock({
			insertError: { message: "insert boom", code: "23505" },
		});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await uploadContactAttachment(REQUEST_ID, file);

		expect(result.ok).toBe(false);
		// best-effort cleanup でアップロード済みファイルを削除している
		expect(removeMock).toHaveBeenCalledTimes(1);
		const removedPaths = removeMock.mock.calls[0]?.[0];
		expect(Array.isArray(removedPaths)).toBe(true);
		expect(removedPaths[0]).toContain(`requests/${REQUEST_ID}/`);
	});

	it("INSERT 成功時はファイル削除を行わない", async () => {
		const { supabase, removeMock } = buildSupabaseMock();
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await uploadContactAttachment(REQUEST_ID, file);

		expect(result.ok).toBe(true);
		expect(removeMock).not.toHaveBeenCalled();
	});

	it("アップロード失敗時は INSERT も削除も行わない", async () => {
		const { supabase, insertMock, removeMock } = buildSupabaseMock({
			uploadError: { message: "upload boom" },
		});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await uploadContactAttachment(REQUEST_ID, file);

		expect(result.ok).toBe(false);
		expect(insertMock).not.toHaveBeenCalled();
		expect(removeMock).not.toHaveBeenCalled();
	});

	it("cleanup の remove が失敗しても元の INSERT エラーを返す", async () => {
		const { supabase, removeMock } = buildSupabaseMock({
			insertError: { message: "insert boom", code: "23505" },
			removeError: { message: "remove boom" },
		});
		// biome-ignore lint/suspicious/noExplicitAny: supabase mock shape
		vi.mocked(createClient).mockResolvedValue(supabase as any);

		const result = await uploadContactAttachment(REQUEST_ID, file);

		expect(result.ok).toBe(false);
		expect(removeMock).toHaveBeenCalledTimes(1);
		// remove のエラー (code なし) ではなく、元の INSERT エラー (23505 → ALREADY_EXISTS)
		// が返ることを検証してエラーの優先順位を保証する
		if (!result.ok) {
			expect(result.error.code).toBe(ErrorCodes.ALREADY_EXISTS);
		}
	});
});
