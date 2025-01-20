import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Json } from "@/types/supabase";

interface AuditLogData {
	action: string;
	target_type: "user" | "kouden" | "announcement" | "support_ticket" | "admin";
	target_id: string;
	details?: Json;
}

export async function getAuditLogs(limit = 100, offset = 0) {
	const supabase = await createClient();
	const { data: logs, error } = await supabase
		.from("admin_audit_logs")
		.select(`
      *,
      admin:auth.users(
        id,
        email
      )
    `)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;
	return logs;
}

export async function createAuditLog(data: AuditLogData) {
	const supabase = await createClient();
	const headersList = await headers();
	const ip = headersList.get("x-forwarded-for") || "unknown";

	const { error } = await supabase.rpc("create_admin_audit_log", {
		p_action: data.action,
		p_target_type: data.target_type,
		p_target_id: data.target_id,
		p_details: data.details || null,
		p_ip_address: ip,
	});

	if (error) throw error;
}

export async function getAuditLogsByAdmin(adminId: string, limit = 100) {
	const supabase = await createClient();
	const { data: logs, error } = await supabase
		.from("admin_audit_logs")
		.select("*")
		.eq("admin_id", adminId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) throw error;
	return logs;
}

export async function getAuditLogsByTargetType(
	targetType: AuditLogData["target_type"],
	limit = 100,
) {
	const supabase = await createClient();
	const { data: logs, error } = await supabase
		.from("admin_audit_logs")
		.select("*")
		.eq("target_type", targetType)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) throw error;
	return logs;
}
