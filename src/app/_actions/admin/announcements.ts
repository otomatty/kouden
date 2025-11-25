"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import logger from "@/lib/logger";

export type Announcement = {
	id: string;
	title: string;
	content: string;
	category: "system" | "feature" | "important" | "event" | "other";
	priority: "low" | "normal" | "high" | "urgent";
	status: "draft" | "published" | "archived";
	publishedAt: string | null;
	expiresAt: string | null;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export async function getAnnouncements() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("system_announcements")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;

	return data?.map((item) => ({
		id: item.id,
		title: item.title,
		content: item.content,
		category: item.category,
		priority: item.priority,
		status: item.status,
		publishedAt: item.published_at,
		expiresAt: item.expires_at,
		createdBy: item.created_by,
		createdAt: item.created_at,
		updatedAt: item.updated_at,
	})) as Announcement[];
}

export async function createAnnouncement({
	title,
	content,
	category,
	priority,
	status,
	publishedAt,
	expiresAt,
}: {
	title: string;
	content: string;
	category: Announcement["category"];
	priority: Announcement["priority"];
	status: Announcement["status"];
	publishedAt?: string;
	expiresAt?: string;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error("Unauthorized");

	// デバッグ: リクエストデータをログ出力
	const requestData = {
		title,
		content,
		category,
		priority,
		status,
		published_at: publishedAt,
		expires_at: expiresAt,
		created_by: user.id,
	};

	const { error } = await supabase
		.from("system_announcements")
		.insert(requestData)
		.select()
		.single();

	if (error) {
		// デバッグ: エラーの詳細をログ出力
		logger.error(
			{
				error: error.message,
				code: error.code,
				details: error.details,
				requestData,
				userId: user.id,
				userEmail: user.email,
			},
			"Failed to create announcement",
		);
		throw error;
	}

	revalidatePath("/admin/announcements");
}

export async function updateAnnouncement(
	id: string,
	{
		title,
		content,
		category,
		priority,
		status,
		publishedAt,
		expiresAt,
	}: {
		title: string;
		content: string;
		category: Announcement["category"];
		priority: Announcement["priority"];
		status: Announcement["status"];
		publishedAt?: string;
		expiresAt?: string;
	},
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("system_announcements")
		.update({
			title,
			content,
			category,
			priority,
			status,
			published_at: publishedAt,
			expires_at: expiresAt,
		})
		.eq("id", id);

	if (error) throw error;
	revalidatePath("/admin/announcements");
}

export async function deleteAnnouncement(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("system_announcements").delete().eq("id", id);

	if (error) throw error;
	revalidatePath("/admin/announcements");
}
