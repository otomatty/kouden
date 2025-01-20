import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "./middleware";
import type { Ticket, TicketMessage } from "@/types/admin";

export async function getTickets() {
	return withAdmin(async () => {
		const supabase = await createClient();

		// チケット基本情報を取得
		const { data: tickets, error: ticketsError } = await supabase
			.from("support_tickets")
			.select("*")
			.order("created_at", { ascending: false });

		if (ticketsError) throw ticketsError;

		// チケットごとのユーザー情報を取得
		const ticketsWithUsers = await Promise.all(
			tickets.map(async (ticket) => {
				const { data: userData, error: userError } =
					await supabase.auth.admin.getUserById(ticket.user_id);

				if (userError) throw userError;

				// 担当管理者の情報を取得
				let assignedAdmin = null;
				if (ticket.assigned_to) {
					const { data: adminData, error: adminError } =
						await supabase.auth.admin.getUserById(ticket.assigned_to);

					if (adminError) throw adminError;
					assignedAdmin = adminData?.user;
				}

				return {
					...ticket,
					user: {
						id: userData.user.id,
						email: userData.user.email ?? "",
					},
					assigned_admin: assignedAdmin
						? {
								id: assignedAdmin.id,
								email: assignedAdmin.email ?? "",
							}
						: null,
				};
			}),
		);

		return ticketsWithUsers as Ticket[];
	});
}

export async function updateTicketStatus(
	ticketId: string,
	status: Ticket["status"],
) {
	return withAdmin(async () => {
		const supabase = await createClient();
		const { error } = await supabase
			.from("support_tickets")
			.update({
				status,
				resolved_at: status === "resolved" ? new Date().toISOString() : null,
			})
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
	});
}

export async function assignTicket(ticketId: string, adminId: string | null) {
	return withAdmin(async () => {
		const supabase = await createClient();
		const { error } = await supabase
			.from("support_tickets")
			.update({ assigned_to: adminId })
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
	});
}

export async function updateTicketPriority(
	ticketId: string,
	priority: Ticket["priority"],
) {
	return withAdmin(async () => {
		const supabase = await createClient();
		const { error } = await supabase
			.from("support_tickets")
			.update({ priority })
			.eq("id", ticketId);

		if (error) throw error;
		revalidatePath("/admin/tickets");
	});
}

export async function getTicketById(ticketId: string) {
	return withAdmin(async () => {
		const supabase = await createClient();

		// チケット基本情報を取得
		const { data: ticket, error: ticketError } = await supabase
			.from("support_tickets")
			.select("*")
			.eq("id", ticketId)
			.single();

		if (ticketError) throw ticketError;

		// ユーザー情報を取得
		const { data: userData, error: userError } =
			await supabase.auth.admin.getUserById(ticket.user_id);

		if (userError) throw userError;

		// 担当管理者の情報を取得
		let assignedAdmin = null;
		if (ticket.assigned_to) {
			const { data: adminData, error: adminError } =
				await supabase.auth.admin.getUserById(ticket.assigned_to);

			if (adminError) throw adminError;
			assignedAdmin = adminData?.user;
		}

		return {
			...ticket,
			user: {
				id: userData.user.id,
				email: userData.user.email ?? "",
			},
			assigned_admin: assignedAdmin
				? {
						id: assignedAdmin.id,
						email: assignedAdmin.email ?? "",
					}
				: null,
		} as Ticket;
	});
}

export async function getTicketMessages(ticketId: string) {
	return withAdmin(async () => {
		const supabase = await createClient();

		// メッセージを取得
		const { data: messages, error: messagesError } = await supabase
			.from("ticket_messages")
			.select("*")
			.eq("ticket_id", ticketId)
			.order("created_at", { ascending: true });

		if (messagesError) throw messagesError;

		// メッセージごとのユーザー情報を取得
		const messagesWithUsers = await Promise.all(
			messages.map(async (message) => {
				const { data: userData, error: userError } =
					await supabase.auth.admin.getUserById(message.created_by);

				if (userError) throw userError;

				return {
					...message,
					user: {
						id: userData.user.id,
						email: userData.user.email ?? "",
					},
				};
			}),
		);

		return messagesWithUsers as TicketMessage[];
	});
}

export async function addTicketMessage(ticketId: string, content: string) {
	return withAdmin(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user?.id) throw new Error("User not found");

		const { error } = await supabase.from("ticket_messages").insert({
			ticket_id: ticketId,
			content,
			created_by: user.id,
			is_admin_reply: true,
		});

		if (error) throw error;
		revalidatePath(`/admin/tickets/${ticketId}`);
	});
}
