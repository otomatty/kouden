import {
	getAnnouncements,
	deleteAnnouncement,
} from "@/app/_actions/admin/announcements";
import { AnnouncementsTable } from "./_components/announcements-table";
import { AddAnnouncementButton } from "./_components/add-announcement-button";

export default async function AnnouncementsPage() {
	const announcements = await getAnnouncements();

	return (
		<div className="container py-10">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">お知らせ管理</h1>
				<AddAnnouncementButton />
			</div>
			<div className="mt-6">
				<AnnouncementsTable
					announcements={announcements}
					deleteAnnouncement={deleteAnnouncement}
				/>
			</div>
		</div>
	);
}
