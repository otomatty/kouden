"use client";

import { type Announcement, updateAnnouncement } from "@/app/_actions/admin/announcements";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Button } from "@/components/ui/button";
import { AnnouncementForm, type AnnouncementFormData } from "./announcement-form";

interface EditAnnouncementButtonProps {
	announcement: Announcement;
}

export function EditAnnouncementButton({ announcement }: EditAnnouncementButtonProps) {
	const onSubmit = async (values: AnnouncementFormData) => {
		try {
			await updateAnnouncement(announcement.id, values);
		} catch (_error) {
			return;
		}
	};

	return (
		<ResponsiveDialog
			trigger={
				<Button variant="outline" size="sm">
					編集
				</Button>
			}
			title="お知らせを編集"
			contentClassName="sm:max-w-[425px]"
		>
			<AnnouncementForm
				defaultValues={{
					title: announcement.title,
					content: announcement.content,
					priority: announcement.priority,
					status: announcement.status,
					publishedAt: announcement.publishedAt ?? "",
					expiresAt: announcement.expiresAt ?? "",
				}}
				onSubmit={onSubmit}
				submitLabel="更新"
			/>
		</ResponsiveDialog>
	);
}
