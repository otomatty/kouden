"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
	key: string;
	label: string;
}

const tabs: Tab[] = [
	{ key: "entries", label: "ご香典" },
	{ key: "offerings", label: "お供物" },
	{ key: "telegrams", label: "ご弔電" },
	{ key: "return_records", label: "お返し" },
	{ key: "statistics", label: "統計" },
	{ key: "settings", label: "設定" },
];

export default function TabNavigation({ koudenId }: { koudenId: string }) {
	const pathname = usePathname() || "";
	return (
		<nav className="flex space-x-4 border-b mb-4">
			{tabs.map((tab) => {
				const href = `/koudens/${koudenId}/${tab.key}`;
				const active = pathname === href;
				return (
					<Link
						key={tab.key}
						href={href}
						className={`px-4 py-2 ${active ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
					>
						{tab.label}
					</Link>
				);
			})}
		</nav>
	);
}
