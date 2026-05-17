"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { validateFileUpload } from "@/lib/security/file-upload-validation";
import { createClient } from "@/lib/supabase/server";
import { contactRequestSchema } from "@/schemas/contact";
import type { Database } from "@/types/supabase";

type ContactRequestRow = Database["public"]["Tables"]["contact_requests"]["Row"];
type ContactResponseRow = Database["public"]["Tables"]["contact_responses"]["Row"];
type ContactRequestAttachmentRow =
	Database["public"]["Tables"]["contact_request_attachments"]["Row"];

type ContactRequestDetail = ContactRequestRow & {
	contact_responses: Pick<
		ContactResponseRow,
		"id" | "request_id" | "responder_id" | "response_message" | "created_at"
	>[];
};

/**
 * Create a new contact request (support unauthenticated and authenticated users).
 * @param formData フォームの入力データ
 */
export async function createContactRequest(formData: FormData): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		const parsed = contactRequestSchema.safeParse({
			category: formData.get("category"),
			name: formData.get("name"),
			email: formData.get("email"),
			subject: formData.get("subject"),
			message: formData.get("message"),
			company_name: formData.get("company_name"),
		});

		if (!parsed.success) {
			const firstIssue = parsed.error.issues[0];
			const errorMessage = firstIssue?.message ?? "入力内容に誤りがあります";
			logger.warn(
				{
					userId: user?.id,
					issues: parsed.error.flatten().fieldErrors,
				},
				"Contact request validation failed",
			);
			throw new KoudenError(errorMessage, ErrorCodes.VALIDATION_ERROR);
		}

		const insertData = {
			category: parsed.data.category,
			name: parsed.data.name ?? null,
			email: parsed.data.email,
			subject: parsed.data.subject ?? null,
			message: parsed.data.message,
			company_name: parsed.data.company_name ?? null,
			user_id: user?.id ?? null,
		};

		const { error } = await supabase.from("contact_requests").insert(insertData);

		if (error) throw error;

		return null;
	}, "お問い合わせの送信");
}

/**
 * Fetch all contact requests for the authenticated user.
 * @returns ユーザーの問い合わせ履歴の配列
 */
export async function getContactRequests(): Promise<ActionResult<ContactRequestRow[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("contact_requests")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });

		if (error) throw error;

		return data ?? [];
	}, "お問い合わせ履歴の取得");
}

/**
 * Fetch a specific contact request with its responses for the authenticated user.
 * @param requestId 問い合わせID
 * @returns 問い合わせの詳細と応答履歴
 */
export async function getContactRequestDetail(
	requestId: string,
): Promise<ActionResult<ContactRequestDetail>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { data, error } = await supabase
			.from("contact_requests")
			.select(`
				*,
				contact_responses (
					id,
					request_id,
					responder_id,
					response_message,
					created_at
				)
			`)
			.eq("id", requestId)
			.eq("user_id", user.id)
			.single();

		if (error) throw error;

		return data as ContactRequestDetail;
	}, "お問い合わせ詳細の取得");
}

/**
 * Upload an attachment file to Supabase storage and record in the database.
 * @param requestId 問い合わせID
 * @param file 添付ファイル
 * @returns 挿入された添付レコード
 */
export async function uploadContactAttachment(
	requestId: string,
	file: File,
): Promise<ActionResult<ContactRequestAttachmentRow[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// requestId の所有者チェック
		const { data: requestOwner, error: ownerError } = await supabase
			.from("contact_requests")
			.select("user_id")
			.eq("id", requestId)
			.single();
		if (ownerError || !requestOwner) {
			logger.warn(
				{
					userId: user.id,
					requestId,
					error: ownerError?.message,
				},
				"Contact request not found for attachment upload",
			);
			throw new KoudenError("お問い合わせが見つかりません", ErrorCodes.FORBIDDEN);
		}
		if (requestOwner.user_id !== user.id) {
			logger.warn(
				{
					userId: user.id,
					requestId,
					ownerUserId: requestOwner.user_id,
				},
				"Unauthorized attachment upload attempt",
			);
			throw new KoudenError("この操作を行う権限がありません", ErrorCodes.FORBIDDEN);
		}

		// ファイルの検証（拡張子・サイズ・MIME・マジックバイト・悪意のあるコンテンツ）
		const validation = await validateFileUpload(file, user.id);
		if (!validation.isValid) {
			logger.warn(
				{
					userId: user.id,
					requestId,
					fileName: file.name,
					reason: validation.details?.reason,
				},
				"Contact attachment validation failed",
			);
			throw new KoudenError(
				validation.error ?? "ファイルの検証に失敗しました",
				ErrorCodes.VALIDATION_ERROR,
			);
		}

		// ファイル名をサニタイズ（path traversal 対策）
		// 拡張子は維持しつつベース名から不正文字を除去し、結果が空/記号だけなら "file" にフォールバック
		const timestamp = Date.now();
		const lastDot = file.name.lastIndexOf(".");
		const rawBase = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
		const rawExt = lastDot > 0 ? file.name.slice(lastDot) : "";
		const sanitizedBase = rawBase.replace(/[^a-zA-Z0-9._-]/g, "_");
		const safeBase = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : "file";
		const safeExt = rawExt.replace(/[^a-zA-Z0-9.]/g, "");
		const safeFileName = `${safeBase}${safeExt}`;
		const filePath = `requests/${requestId}/${timestamp}_${safeFileName}`;
		// ストレージにアップロード
		const { error: uploadError } = await supabase.storage
			.from("contact-attachments")
			.upload(filePath, file, { cacheControl: "3600", upsert: false });
		if (uploadError) {
			throw uploadError;
		}
		// データベースにメタ情報を保存
		const { data, error: dbError } = await supabase
			.from("contact_request_attachments")
			.insert({ request_id: requestId, file_url: filePath, file_name: file.name })
			.select();
		if (dbError) {
			throw dbError;
		}
		return data ?? [];
	}, "添付ファイルのアップロード");
}
