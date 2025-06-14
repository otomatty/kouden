"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a new contact request (support unauthenticated and authenticated users).
 * @param formData フォームの入力データ
 * @returns 挿入された問い合わせレコード
 */
export async function createContactRequest(formData: FormData) {
	const supabase = await createClient();
	// 認証ユーザー情報を取得
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// フォームデータを構築
	const insertData = {
		category: formData.get("category") as string,
		name: formData.get("name") as string | null,
		email: formData.get("email") as string,
		subject: formData.get("subject") as string | null,
		message: formData.get("message") as string,
		company_name: formData.get("company_name") as string | null,
		user_id: user?.id ?? null,
	};

	// データベースに挿入
	const { data, error } = await supabase.from("contact_requests").insert(insertData);

	if (error) {
		console.error("Failed to create contact request:", error);
		throw new Error(error.message);
	}

	// 挿入されたレコードを返却
	return data;
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
		console.error("Failed to fetch contact requests:", error);
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
		console.error("Failed to fetch contact request detail:", error);
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
		console.error("Failed to upload attachment:", uploadError);
		throw new Error(uploadError.message);
	}
	// データベースにメタ情報を保存
	const { data, error: dbError } = await supabase
		.from("contact_request_attachments")
		.insert({ request_id: requestId, file_url: filePath, file_name: file.name })
		.select();
	if (dbError) {
		console.error("Failed to insert attachment record:", dbError);
		throw new Error(dbError.message);
	}
	return data;
}
