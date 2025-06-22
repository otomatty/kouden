"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useState, useMemo } from "react";
import type { NotificationItem } from "@/types/notifications";
import { createClient } from "@/lib/supabase/client";

interface NotificationsPopoverProps {
	notifications: NotificationItem[];
}

export function NotificationsPopover({ notifications }: NotificationsPopoverProps) {
	const supabase = createClient();
	const [items, setItems] = useState<NotificationItem[]>(notifications);
	const [isOpen, setIsOpen] = useState(false);
	const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

	const handleOpenChange = async (open: boolean) => {
		setIsOpen(open);
		if (open && items.some((n) => !n.is_read)) {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				await supabase
					.from("notifications")
					.update({ is_read: true })
					.eq("user_id", user.id)
					.eq("is_read", false);
				setItems(items.map((n) => ({ ...n, is_read: true })));
			}
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
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
				<ScrollArea className="h-[400px]">
					{items.length === 0 ? (
						<div className="p-4 text-center text-sm text-gray-500">通知はありません</div>
					) : (
						<div className="divide-y relative">
							{items.map((n) => (
								<div
									key={n.id}
									className={`w-full p-4 ${
										n.is_read ? "bg-gray-50" : "bg-white hover:bg-blue-50"
									} transition-colors duration-200`}
								>
									{!n.is_read && (
										<div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
									)}
									<div className="flex items-center justify-between mb-1">
										<span className="text-sm font-medium">
											{n.notification_types.default_title}
										</span>
										<span className="text-xs text-gray-500">{formatDate(n.created_at)}</span>
									</div>
									<p className="text-sm text-gray-600">{n.data?.message ?? ""}</p>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
