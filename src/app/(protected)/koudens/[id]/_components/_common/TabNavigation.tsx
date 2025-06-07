"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";
import { Gift, List, Send, RefreshCcw, BarChart2, Settings } from "lucide-react";

interface Tab {
	key: string;
	label: string;
	icon: LucideIcon;
}

const tabs: Tab[] = [
	{ key: "entries", label: "ご香典", icon: Gift },
	{ key: "offerings", label: "お供物", icon: List },
	{ key: "telegrams", label: "ご弔電", icon: Send },
	{ key: "return_records", label: "お返し", icon: RefreshCcw },
	{ key: "statistics", label: "統計", icon: BarChart2 },
	{ key: "settings", label: "設定", icon: Settings },
];

export default function TabNavigation({ koudenId }: { koudenId: string }) {
	const pathname = usePathname() || "";
	return (
		<nav className="hidden md:flex space-x-4 border-b mb-4">
			{tabs.map((tab) => {
				const href = `/koudens/${koudenId}/${tab.key}`;
				const active = pathname === href;
				const Icon = tab.icon;
				return (
					<Link
						key={tab.key}
						href={href}
						className={`flex items-center px-4 py-2 ${
							active ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
						}`}
					>
						<Icon className="w-4 h-4 mr-2" />
						<span>{tab.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
