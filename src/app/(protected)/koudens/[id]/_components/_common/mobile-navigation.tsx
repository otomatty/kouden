"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
	Gift,
	RefreshCcw,
	BarChart2,
	List,
	Send,
	Settings,
	ChevronRight,
	ChevronLeft,
	Plus,
} from "lucide-react";

interface MenuItem {
	key: string;
	label: string;
	icon: LucideIcon;
	href: (id: string) => string;
}

const menuSets: [MenuItem[], MenuItem[]] = [
	[
		{ key: "entries", label: "ご香典", icon: Gift, href: (id) => `/koudens/${id}/entries` },
		{
			key: "return_records",
			label: "お返し",
			icon: RefreshCcw,
			href: (id) => `/koudens/${id}/return_records`,
		},
		{
			key: "statistics",
			label: "統計",
			icon: BarChart2,
			href: (id) => `/koudens/${id}/statistics`,
		},
	],
	[
		{ key: "offerings", label: "お供物", icon: List, href: (id) => `/koudens/${id}/offerings` },
		{ key: "telegrams", label: "ご弔電", icon: Send, href: (id) => `/koudens/${id}/telegrams` },
		{ key: "settings", label: "設定", icon: Settings, href: (id) => `/koudens/${id}/settings` },
	],
];

export default function MobileNavigation({
	koudenId,
	onActionClick,
	actionLabel = "",
}: { koudenId: string; onActionClick: () => void; actionLabel?: string }) {
	const pathname = usePathname() || "";
	const [menuIndex, setMenuIndex] = useState(0);
	const currentMenu: MenuItem[] = menuSets[menuIndex] ?? menuSets[0];

	const handleToggleMenu = () => {
		setMenuIndex((menuIndex + 1) % menuSets.length);
	};

	// split into left 2 items and right 1 item
	const leftItems = currentMenu.slice(0, 2);
	const rightItem = currentMenu[2];

	return (
		<div className="fixed bottom-0 inset-x-0 bg-white border-t h-16 flex items-center justify-between px-4 md:hidden">
			{/* Left side items */}
			<div className="flex space-x-8">
				{leftItems.map((item) => {
					const active = pathname === item.href(koudenId);
					return (
						<Link
							key={item.key}
							href={item.href(koudenId)}
							className={`flex flex-col items-center text-xs ${
								active ? "text-primary" : "text-muted-foreground"
							}`}
						>
							<item.icon className="w-6 h-6" />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
			{/* Central action button with label below */}
			<div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
				<button
					type="button"
					onClick={onActionClick}
					className="bg-primary text-white p-4 rounded-full shadow-lg"
				>
					<Plus className="w-6 h-6" />
				</button>
				{actionLabel && (
					<span className="mt-1 text-xs font-semibold text-center">{actionLabel}</span>
				)}
			</div>
			{/* Right side: nav item and toggle */}
			<div className="flex space-x-8 items-center">
				{rightItem && (
					<Link
						key={rightItem.key}
						href={rightItem.href(koudenId)}
						className={`flex flex-col items-center text-xs ${
							pathname === rightItem.href(koudenId) ? "text-primary" : "text-muted-foreground"
						}`}
					>
						<rightItem.icon className="w-6 h-6" />
						<span>{rightItem.label}</span>
					</Link>
				)}
				<button
					type="button"
					onClick={handleToggleMenu}
					className="flex flex-col items-center text-xs text-muted-foreground"
				>
					{menuIndex === 0 ? (
						<ChevronRight className="w-6 h-6" />
					) : (
						<ChevronLeft className="w-6 h-6" />
					)}
				</button>
			</div>
		</div>
	);
}
