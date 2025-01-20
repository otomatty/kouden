export interface AdminUser {
	id: string;
	user_id: string;
	role: string;
	created_at: string | null;
	updated_at: string | null;
	user: {
		id: string;
		display_name: string;
		avatar_url: string | null;
		created_at: string;
		updated_at: string;
	};
}

export interface Announcement {
	id: string;
	title: string;
	content: string;
	status: "draft" | "published" | "archived";
	priority: "low" | "normal" | "high" | "urgent";
	created_by: string;
	created_at: string | null;
	updated_at: string | null;
	published_at: string | null;
	expires_at: string | null;
}

export interface Ticket {
	id: string;
	subject: string;
	content: string;
	status: "open" | "in_progress" | "resolved" | "closed";
	priority: "low" | "normal" | "high" | "urgent";
	user_id: string;
	assigned_to: string | null;
	created_at: string | null;
	updated_at: string | null;
	resolved_at: string | null;
	user: {
		id: string;
		email: string;
	};
	assigned_admin?: {
		id: string;
		email: string;
	} | null;
}

export interface TicketMessage {
	id: string;
	ticket_id: string;
	content: string;
	is_admin_reply: boolean;
	created_by: string;
	created_at: string;
	user: {
		id: string;
		email: string;
	};
}
