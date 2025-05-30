"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import type { Announcement } from "@/types/admin";
import { formatDate } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const categoryColors = {
	system: "bg-purple-500",
	feature: "bg-blue-500",
	important: "bg-red-500",
	event: "bg-green-500",
	other: "bg-gray-500",
} as const;

const categoryLabels = {
	system: "システム関連",
	feature: "機能追加・変更",
	important: "重要なお知らせ",
	event: "イベント",
	other: "その他",
} as const;

export function NotificationsPopover() {
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set());
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
	const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
	const supabase = createClient();

	const fetchAnnouncementsAndReads = useCallback(async () => {
		const { data: announcementsData, error: announcementsError } = await supabase
			.from("system_announcements")
			.select("*")
			.eq("status", "published")
			.gte("published_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
			.order("created_at", { ascending: false })
			.limit(10);

		if (announcementsError) {
			console.error("Failed to fetch announcements:", announcementsError);
			return;
		}

		const { data: readsData } = await supabase
			.from("user_announcement_reads")
			.select("announcement_id, is_read")
			.eq("is_read", true);

		const readIds = new Set(readsData?.map((read) => read.announcement_id) || []);
		setReadAnnouncementIds(readIds);

		const formattedAnnouncements = announcementsData.map((item) => ({
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

		setAnnouncements(formattedAnnouncements);
		setUnreadCount(formattedAnnouncements.filter((a) => !readIds.has(a.id)).length);
	}, [supabase]);

	useEffect(() => {
		fetchAnnouncementsAndReads();

		const channel = supabase
			.channel("system_announcements")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "system_announcements",
				},
				() => {
					fetchAnnouncementsAndReads();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, fetchAnnouncementsAndReads]);

	const markAsRead = useCallback(
		async (announcementId: string) => {
			const { error } = await supabase
				.from("user_announcement_reads")
				.update({ is_read: true })
				.eq("announcement_id", announcementId);

			if (error) {
				console.error("Failed to mark as read:", error);
				return;
			}

			setReadAnnouncementIds(new Set([...readAnnouncementIds, announcementId]));
			setUnreadCount((prev) => Math.max(0, prev - 1));
		},
		[supabase, readAnnouncementIds],
	);

	const handleAnnouncementClick = useCallback(
		(announcement: Announcement) => {
			setSelectedAnnouncement(announcement);
			markAsRead(announcement.id);
		},
		[markAsRead],
	);

	const handleAnnouncementHover = useCallback(
		(announcement: Announcement) => {
			if (readAnnouncementIds.has(announcement.id)) return;

			if (hoverTimer) clearTimeout(hoverTimer);
			const timer = setTimeout(() => {
				markAsRead(announcement.id);
			}, 2000); // 2秒後に既読にする
			setHoverTimer(timer);
		},
		[markAsRead, readAnnouncementIds, hoverTimer],
	);

	const handleAnnouncementHoverEnd = useCallback(() => {
		if (hoverTimer) {
			clearTimeout(hoverTimer);
			setHoverTimer(null);
		}
	}, [hoverTimer]);

	useEffect(() => {
		return () => {
			if (hoverTimer) clearTimeout(hoverTimer);
		};
	}, [hoverTimer]);

	const markAllAsRead = useCallback(async () => {
		const unreadAnnouncements = announcements.filter((a) => !readAnnouncementIds.has(a.id));
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user?.id) return;

		const { error } = await supabase.from("user_announcement_reads").upsert(
			unreadAnnouncements.map((announcement) => ({
				announcement_id: announcement.id,
				user_id: user.id,
				is_read: true,
			})),
		);

		if (error) {
			console.error("Failed to mark all as read:", error);
			return;
		}

		const newReadIds = new Set([...readAnnouncementIds, ...unreadAnnouncements.map((a) => a.id)]);
		setReadAnnouncementIds(newReadIds);
		setUnreadCount(0);
	}, [supabase, announcements, readAnnouncementIds]);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Popover open={isOpen} onOpenChange={setIsOpen}>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="relative">
								<Bell className="h-5 w-5" />
								{unreadCount > 0 && (
									<Badge
										variant="destructive"
										className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
									>
										{unreadCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="end">
							<div className="p-4 border-b flex items-center justify-between">
								<h4 className="font-semibold">お知らせ</h4>
								<div className="flex items-center gap-2">
									{unreadCount > 0 && (
										<>
											<Badge variant="secondary" className="text-xs">
												未読 {unreadCount}件
											</Badge>
											<Button
												variant="ghost"
												size="sm"
												className="text-xs h-7 px-2"
												onClick={markAllAsRead}
											>
												すべて既読
											</Button>
										</>
									)}
								</div>
							</div>
							<ScrollArea className="h-[400px]">
								{announcements.length === 0 ? (
									<div className="p-4 text-center text-sm text-gray-500">お知らせはありません</div>
								) : (
									<div className="divide-y">
										{announcements.map((announcement) => (
											<button
												key={announcement.id}
												className={`w-full text-left p-4 ${
													readAnnouncementIds.has(announcement.id)
														? "bg-gray-50"
														: "bg-white hover:bg-blue-50"
												} relative transition-colors duration-200`}
												onClick={() => handleAnnouncementClick(announcement)}
												onMouseEnter={() => handleAnnouncementHover(announcement)}
												onMouseLeave={handleAnnouncementHoverEnd}
												type="button"
											>
												{!readAnnouncementIds.has(announcement.id) && (
													<div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
												)}
												<div className="flex items-center gap-2 mb-2">
													<Badge
														variant="secondary"
														className={categoryColors[announcement.category]}
													>
														{categoryLabels[announcement.category]}
													</Badge>
													<span className="text-xs text-gray-500">
														{announcement.publishedAt ? formatDate(announcement.publishedAt) : "-"}
													</span>
												</div>
												<h5 className="font-medium mb-1">{announcement.title}</h5>
												<p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
											</button>
										))}
									</div>
								)}
							</ScrollArea>
						</PopoverContent>
					</Popover>
				</TooltipTrigger>
				<TooltipContent>
					<p>お知らせ</p>
				</TooltipContent>
			</Tooltip>

			<ResponsiveDialog
				trigger={<div />}
				title={selectedAnnouncement?.title}
				contentClassName="sm:max-w-2xl"
			>
				<div className="flex items-center gap-2 mb-4">
					{selectedAnnouncement && (
						<>
							<Badge variant="secondary" className={categoryColors[selectedAnnouncement.category]}>
								{categoryLabels[selectedAnnouncement.category]}
							</Badge>
							<span className="text-sm text-gray-500">
								{selectedAnnouncement.publishedAt
									? formatDate(selectedAnnouncement.publishedAt)
									: "-"}
							</span>
						</>
					)}
				</div>
				<div className="prose prose-sm max-w-none">{selectedAnnouncement?.content}</div>
			</ResponsiveDialog>
		</>
	);
}
