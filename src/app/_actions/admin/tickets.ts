import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketMessage } from "@/types/admin";
import { revalidatePath } from "next/cache";
import { getAuthUsersByIds } from "./auth-users";

/**
 * 管理者権限チェック
 * `withActionResult` がエラーをクライアント向けの ActionResult に変換するため、
 * `withAdmin` HOF（redirect使用）の代わりに KoudenError を throw する。
 */
async function assertAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.id) {
		throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
	}

	const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (rpcError) {
		throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (!isAdmin) {
		throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
	}

	return { supabase, user };
}

export async function getTickets(): Promise<ActionResult<Ticket[]>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		// チケット基本情報を取得
		const { data: tickets, error: ticketsError } = await supabase
			.from("support_tickets")
			.select("*")
			.order("created_at", { ascending: false });

		if (ticketsError) throw ticketsError;

		// チケットの起票者・担当管理者の Auth 情報を 1 回の listUsers で一括解決（N+1解消）
		const authUsers = await getAuthUsersByIds(
			tickets.flatMap((ticket) => [ticket.user_id, ticket.assigned_to]),
		);

		const ticketsWithUsers = tickets.map((ticket) => {
			const assignedAdmin = ticket.assigned_to ? authUsers.get(ticket.assigned_to) : undefined;

			return {
				...ticket,
				user: {
					id: ticket.user_id,
					email: authUsers.get(ticket.user_id)?.email ?? "",
				},
				assigned_admin: assignedAdmin ? { id: assignedAdmin.id, email: assignedAdmin.email } : null,
			};
		});

		return ticketsWithUsers as Ticket[];
	}, "チケット一覧の取得");
}

export async function updateTicketStatus(
	ticketId: string,
	status: Ticket["status"],
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();
		const { error } = await supabase
			.from("support_tickets")
			.update({
				status,
				resolved_at: status === "resolved" ? new Date().toISOString() : null,
			})
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
		return null;
	}, "チケットステータスの更新");
}

export async function assignTicket(
	ticketId: string,
	adminId: string | null,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();
		const { error } = await supabase
			.from("support_tickets")
			.update({ assigned_to: adminId })
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
		return null;
	}, "チケットの担当割り当て");
}

export async function updateTicketPriority(
	ticketId: string,
	priority: Ticket["priority"],
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();
		const { error } = await supabase
			.from("support_tickets")
			.update({ priority })
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
		return null;
	}, "チケット優先度の更新");
}

export async function getTicketById(ticketId: string): Promise<ActionResult<Ticket>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		// チケット基本情報を取得
		const { data: ticket, error: ticketError } = await supabase
			.from("support_tickets")
			.select("*")
			.eq("id", ticketId)
			.single();

		if (ticketError) throw ticketError;

		// 起票者・担当管理者の Auth 情報を一括解決
		const authUsers = await getAuthUsersByIds([ticket.user_id, ticket.assigned_to]);
		const assignedAdmin = ticket.assigned_to ? authUsers.get(ticket.assigned_to) : undefined;

		return {
			...ticket,
			user: {
				id: ticket.user_id,
				email: authUsers.get(ticket.user_id)?.email ?? "",
			},
			assigned_admin: assignedAdmin ? { id: assignedAdmin.id, email: assignedAdmin.email } : null,
		} as Ticket;
	}, "チケット詳細の取得");
}

export async function getTicketMessages(ticketId: string): Promise<ActionResult<TicketMessage[]>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		// メッセージを取得
		const { data: messages, error: messagesError } = await supabase
			.from("ticket_messages")
			.select("*")
			.eq("ticket_id", ticketId)
			.order("created_at", { ascending: true });

		if (messagesError) throw messagesError;

		// メッセージ投稿者の Auth 情報を 1 回の listUsers で一括解決（N+1解消）
		const authUsers = await getAuthUsersByIds(messages.map((message) => message.created_by));

		const messagesWithUsers = messages.map((message) => ({
			...message,
			user: {
				id: message.created_by,
				email: authUsers.get(message.created_by)?.email ?? "",
			},
		}));

		return messagesWithUsers as TicketMessage[];
	}, "チケットメッセージの取得");
}

export async function addTicketMessage(
	ticketId: string,
	content: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase, user } = await assertAdmin();

		const { error } = await supabase.from("ticket_messages").insert({
			ticket_id: ticketId,
			content,
			created_by: user.id,
			is_admin_reply: true,
		});

		if (error) throw error;
		revalidatePath(`/admin/tickets/${ticketId}`);
		return null;
	}, "チケットメッセージの追加");
}
