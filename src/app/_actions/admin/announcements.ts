import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "./middleware";
import type { Announcement } from "@/types/admin";

export interface AnnouncementData {
	title: string;
	content: string;
	priority: "low" | "normal" | "high" | "urgent";
	status: "draft" | "published" | "archived";
	published_at?: string;
	expires_at?: string;
}

export async function getAnnouncements(includeUnpublished = false) {
	return withAdmin(async () => {
		const supabase = await createClient();
		let query = supabase
			.from("system_announcements")
			.select("*")
			.order("created_at", { ascending: false });

		if (!includeUnpublished) {
			query = query
				.eq("status", "published")
				.lte("published_at", new Date().toISOString())
				.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
		}

		const { data: announcements, error } = await query;

		if (error) throw error;
		return announcements as Announcement[];
	});
}

export async function getAnnouncementById(id: string) {
	const supabase = await createClient();
	const { data: announcement, error } = await supabase
		.from("system_announcements")
		.select("*")
		.eq("id", id)
		.single();

	if (error) throw error;
	return announcement;
}

export async function createAnnouncement(data: AnnouncementData) {
	return withAdmin(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user?.id) throw new Error("User not found");

		const { error } = await supabase.from("system_announcements").insert({
			...data,
			created_by: user.id,
		});

		if (error) throw error;
		revalidatePath("/admin/announcements");
	});
}

export async function updateAnnouncement(
	id: string,
	data: Partial<AnnouncementData>,
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("system_announcements")
		.update(data)
		.eq("id", id);

	if (error) throw error;
	revalidatePath("/admin/announcements");
}

export async function deleteAnnouncement(id: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("system_announcements")
		.delete()
		.eq("id", id);

	if (error) throw error;
	revalidatePath("/admin/announcements");
}
