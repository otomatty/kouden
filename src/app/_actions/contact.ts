"use server";

import logger from "@/lib/logger";
import { validateFileUpload } from "@/lib/security/file-upload-validation";
import { createClient } from "@/lib/supabase/server";
import { contactRequestSchema } from "@/schemas/contact";

export type CreateContactRequestResult = { success: true } | { success: false; error: string };

/**
 * Create a new contact request (support unauthenticated and authenticated users).
 * @param formData フォームの入力データ
 * @returns `{ success: true }` または `{ success: false, error }`
 */
export async function createContactRequest(
	formData: FormData,
): Promise<CreateContactRequestResult> {
	try {
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
			return { success: false, error: errorMessage };
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

		if (error) {
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user?.id,
					category: insertData.category,
				},
				"Failed to create contact request",
			);
			return { success: false, error: "お問い合わせの送信に失敗しました" };
		}

		return { success: true };
	} catch (err) {
		logger.error(
			{ error: err instanceof Error ? err.message : String(err) },
			"Unexpected error while creating contact request",
		);
		return { success: false, error: "お問い合わせの送信に失敗しました" };
	}
}

/**
 * Fetch all contact requests for the authenticated user.
 * @returns ユーザーの問い合わせ履歴の配列
 */
export async function getContactRequests() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const { data, error } = await supabase
		.from("contact_requests")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	if (error) {
		logger.error(
			{
				error: error.message,
				code: error.code,
				userId: user.id,
			},
			"Failed to fetch contact requests",
		);
		throw new Error(error.message);
	}

	return data;
}

/**
 * Fetch a specific contact request with its responses for the authenticated user.
 * @param requestId 問い合わせID
 * @returns 問い合わせの詳細と応答履歴
 */
export async function getContactRequestDetail(requestId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Unauthorized");
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

	if (error) {
		logger.error(
			{
				error: error.message,
				code: error.code,
				userId: user.id,
				requestId,
			},
			"Failed to fetch contact request detail",
		);
		throw new Error(error.message);
	}

	return data;
}

/**
 * Upload an attachment file to Supabase storage and record in the database.
 * @param requestId 問い合わせID
 * @param file 添付ファイル
 * @returns 挿入された添付レコード
 */
export async function uploadContactAttachment(requestId: string, file: File) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		throw new Error("Unauthorized");
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
		throw new Error("Forbidden");
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
		throw new Error("Forbidden");
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
		throw new Error(validation.error ?? "ファイルの検証に失敗しました");
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
		logger.error(
			{
				error: uploadError.message,
				requestId,
				fileName: file.name,
			},
			"Failed to upload attachment",
		);
		throw new Error(uploadError.message);
	}
	// データベースにメタ情報を保存
	const { data, error: dbError } = await supabase
		.from("contact_request_attachments")
		.insert({ request_id: requestId, file_url: filePath, file_name: file.name })
		.select();
	if (dbError) {
		logger.error(
			{
				error: dbError.message,
				code: dbError.code,
				requestId,
				fileName: file.name,
			},
			"Failed to insert attachment record",
		);
		throw new Error(dbError.message);
	}
	return data;
}
