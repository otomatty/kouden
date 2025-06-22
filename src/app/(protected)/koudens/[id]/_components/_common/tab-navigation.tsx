"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";
import {
	Gift,
	List,
	Send,
	RefreshCcw,
	BarChart2,
	Settings,
	Table2,
	Box,
	BarChart3,
	Mail,
} from "lucide-react";

interface Tab {
	key: string;
	label: string;
	icon: LucideIcon;
}

const tabs: Tab[] = [
	{ key: "entries", label: "ご香典", icon: Table2 },
	{ key: "offerings", label: "お供物", icon: Gift },
	{ key: "telegrams", label: "ご弔電", icon: Mail },
	{ key: "return_records", label: "お返し", icon: Box },
	{ key: "statistics", label: "統計", icon: BarChart3 },
	{ key: "settings", label: "設定", icon: Settings },
];

export default function TabNavigation({ koudenId }: { koudenId: string }) {
	const pathname = usePathname() || "";

	// 管理者モードかどうかを判定
	const isAdminMode = pathname.startsWith("/admin/koudens/");
	const basePath = isAdminMode ? `/admin/koudens/${koudenId}` : `/koudens/${koudenId}`;

	return (
		<nav className="hidden md:flex space-x-4 border-b mb-4" data-tour="navigation-tabs">
			{tabs.map((tab) => {
				const href = `${basePath}/${tab.key}`;
				const active = pathname === href;
				const Icon = tab.icon;
				return (
					<Link
						key={tab.key}
						href={href}
						className={`flex items-center px-4 py-2 ${
							active
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
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
