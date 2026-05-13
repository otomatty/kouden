"use server";

import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { contactRequestSchema } from "@/schemas/contact";

export type CreateContactRequestResult =
	| { success: true; data: unknown }
	| { success: false; error: string };

/**
 * Create a new contact request (support unauthenticated and authenticated users).
 * @param formData フォームの入力データ
 * @returns `{ success: true, data }` または `{ success: false, error }`
 */
export async function createContactRequest(
	formData: FormData,
): Promise<CreateContactRequestResult> {
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

	const { data, error } = await supabase.from("contact_requests").insert(insertData);

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

	return { success: true, data };
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
	// ファイルパスを生成
	const timestamp = Date.now();
	const filePath = `requests/${requestId}/${timestamp}_${file.name}`;
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
