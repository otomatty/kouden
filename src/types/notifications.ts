import type { Json } from "./supabase";

/**
 * 通知アイテムの型定義
 */
export interface NotificationItem {
	id: string;
	created_at: string;
	is_read: boolean;
	data: { message?: string } | null;
	link_path: string | null;
	notification_types: {
		type_key: string;
		default_title: string;
		default_icon: string | null;
	};
}
