import { Suspense } from "react";
import {
	getAnnouncements,
	createAnnouncement,
	deleteAnnouncement,
} from "@/app/_actions/admin/announcements";
import { AnnouncementsTable } from "./_components/announcements-table";
import { AddAnnouncementButton } from "./_components/add-announcement-button";
import { Skeleton } from "@/components/ui/skeleton";

async function AnnouncementsContent() {
	const announcements = await getAnnouncements(true);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">お知らせ管理</h1>
				<AddAnnouncementButton createAnnouncement={createAnnouncement} />
			</div>
			<AnnouncementsTable
				announcements={announcements}
				deleteAnnouncement={deleteAnnouncement}
			/>
		</div>
	);
}

function AnnouncementsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-10 w-24" />
			</div>
			<Skeleton className="h-[400px] w-full" />
		</div>
	);
}

export default function AnnouncementsPage() {
	return (
		<Suspense fallback={<AnnouncementsSkeleton />}>
			<AnnouncementsContent />
		</Suspense>
	);
}
