export type AnnouncementType = "info" | "warning" | "success" | "promotion" | "maintenance";

export interface Announcement {
	id: string;
	title: string;
	description: string;
	image_url: string | null;
	cta_label: string | null;
	cta_link: string | null;
	type: AnnouncementType;
	priority: number;
	is_active: boolean;
	show_until: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
}

export interface CreateAnnouncementInput {
	title: string;
	description: string;
	image_url?: string;
	cta_label?: string;
	cta_link?: string;
	type: AnnouncementType;
	priority?: number;
	show_until?: string;
}

export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
	id: string;
	is_active?: boolean;
}
