"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	Briefcase,
	Users,
	Bell,
	LifeBuoy,
	FileText,
	Settings,
	ArrowLeft,
} from "lucide-react";

const navigation = [
	{ name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
	{ name: "組織管理", href: "/admin/organizations", icon: Briefcase },
	{ name: "管理者", href: "/admin/users", icon: Users },
	{ name: "お知らせ", href: "/admin/announcements", icon: Bell },
	{ name: "サポート", href: "/admin/support", icon: LifeBuoy },
	{ name: "監査ログ", href: "/admin/audit-logs", icon: FileText },
	{ name: "設定", href: "/admin/settings", icon: Settings },
	{ name: "アプリに戻る", href: "/koudens", icon: ArrowLeft },
];

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<div className="hidden md:flex md:flex-col md:w-64 md:bg-gray-900">
			<div className="flex-1 flex flex-col min-h-0">
				<div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
					<h1 className="text-xl font-bold text-white">管理画面</h1>
				</div>
				<div className="flex-1 flex flex-col overflow-y-auto">
					<nav className="flex-1 px-2 py-4 space-y-1">
						{navigation.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										isActive
											? "bg-gray-800 text-white"
											: "text-gray-300 hover:bg-gray-700 hover:text-white",
										"group flex items-center px-2 py-2 text-sm font-medium rounded-md",
									)}
								>
									<item.icon
										className={cn(
											isActive ? "text-white" : "text-gray-400 group-hover:text-white",
											"mr-3 h-5 w-5 flex-shrink-0",
										)}
									/>
									{item.name}
								</Link>
							);
						})}
					</nav>
				</div>
			</div>
		</div>
	);
}
