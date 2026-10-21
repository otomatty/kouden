/**
 * 全ユーザー管理用の型定義
 */
export interface UserListItem {
	id: string;
	display_name: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	// 認証情報
	email?: string;
	last_sign_in_at?: string;
	email_confirmed_at?: string;
	// 統計情報
	stats: {
		owned_koudens_count: number;
		participated_koudens_count: number;
		total_entries_count: number;
	};
	// 管理者情報
	admin_info?: {
		role: "admin" | "super_admin";
		granted_at: string;
	};
}

export interface UserDetail extends UserListItem {
	// 参加香典帳一覧
	koudens: Array<{
		id: string;
		title: string;
		role: "owner" | "editor" | "viewer";
		joined_at: string;
		last_activity?: string;
	}>;
}

export interface GetUsersParams {
	page?: number;
	limit?: number;
	search?: string;
	filter?: "all" | "admin" | "regular";
	sortBy?: "created_at" | "display_name" | "last_sign_in_at";
	sortOrder?: "asc" | "desc";
}

export interface AdminKoudenListItem {
	id: string;
	title: string;
	description: string | null;
	status: "active" | "archived" | "inactive";
	created_at: string;
	updated_at: string;
	owner: {
		id: string;
		display_name: string;
		avatar_url: string | null;
	};
	plan: {
		id: string;
		code: string;
		name: string;
	};
	stats: {
		entries_count: number;
		members_count: number;
		total_amount: number;
	};
	expired: boolean;
	remainingDays?: number;
}

export interface GetAdminKoudensParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: "all" | "active" | "archived" | "inactive";
	sortBy?: "created_at" | "updated_at" | "title" | "entries_count";
	sortOrder?: "asc" | "desc";
}

export type UserAuthInfo = {
	email?: string;
	last_sign_in_at?: string;
	email_confirmed_at?: string;
};

export type UserStats = {
	owned_koudens_count: number;
	participated_koudens_count: number;
	total_entries_count: number;
};

export type UserAdminInfo =
	| {
			role: "admin" | "super_admin";
			granted_at: string;
	  }
	| undefined;

export type UserKoudenItem = {
	id: string;
	title: string;
	role: "owner" | "editor" | "viewer";
	joined_at: string;
	last_activity?: string;
};
