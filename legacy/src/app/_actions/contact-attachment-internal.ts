import logger from "@/lib/logger";
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ContactRequestAttachmentRow =
	Database["public"]["Tables"]["contact_request_attachments"]["Row"];

interface PersistContactAttachmentParams {
	supabase: SupabaseServerClient;
	requestId: string;
	file: File;
	userId?: string;
}

/**
 * 添付ファイルの Storage パスを生成する（path traversal 対策済み）。
 */
export function buildContactAttachmentPath(requestId: string, fileName: string): string {
	const timestamp = Date.now();
	const uniqueSuffix = crypto.randomUUID();
	const lastDot = fileName.lastIndexOf(".");
	const rawBase = lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
	const rawExt = lastDot > 0 ? fileName.slice(lastDot) : "";
	const sanitizedBase = rawBase.replace(/[^a-zA-Z0-9._-]/g, "_");
	const safeBase = /[a-zA-Z0-9]/.test(sanitizedBase) ? sanitizedBase : "file";
	const safeExt = rawExt.replace(/[^a-zA-Z0-9.]/g, "");
	const safeFileName = `${safeBase}${safeExt}`;
	return `requests/${requestId}/${timestamp}_${uniqueSuffix}_${safeFileName}`;
}

/**
 * 添付ファイルを Storage にアップロードし、DB にメタ情報を保存する。
 * INSERT 失敗時は best-effort で Storage 上のファイルを削除する (#115)。
 */
export async function persistContactAttachment({
	supabase,
	requestId,
	file,
	userId,
}: PersistContactAttachmentParams): Promise<ContactRequestAttachmentRow[]> {
	const filePath = buildContactAttachmentPath(requestId, file.name);

	const { error: uploadError } = await supabase.storage
		.from("contact-attachments")
		.upload(filePath, file, { cacheControl: "3600", upsert: false });
	if (uploadError) {
		throw uploadError;
	}

	const { data, error: dbError } = await supabase
		.from("contact_request_attachments")
		.insert({ request_id: requestId, file_url: filePath, file_name: file.name })
		.select();
	if (dbError) {
		const { error: cleanupError } = await supabase.storage
			.from("contact-attachments")
			.remove([filePath]);
		if (cleanupError) {
			logger.warn(
				{
					userId,
					requestId,
					filePath,
					error: cleanupError.message,
				},
				"Failed to cleanup orphaned contact attachment file",
			);
		}
		throw dbError;
	}

	return data ?? [];
}
