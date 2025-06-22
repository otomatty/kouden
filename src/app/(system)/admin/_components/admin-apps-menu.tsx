"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

const adminApps = [
	{ name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
	{ name: "組織管理", href: "/admin/organizations", icon: Briefcase },
	{ name: "管理者", href: "/admin/users", icon: Users },
	{ name: "オウンドメディア", href: "/admin/blog", icon: FileText },
	{ name: "お知らせ", href: "/admin/announcements", icon: Bell },
	{ name: "サポート", href: "/admin/support", icon: LifeBuoy },
	{ name: "監査ログ", href: "/admin/audit-logs", icon: FileText },
	{ name: "設定", href: "/admin/settings", icon: Settings },
	{ name: "アプリに戻る", href: "/koudens", icon: ArrowLeft },
];

export function AdminAppsMenu() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="管理メニュー"
				>
					<div className="grid grid-cols-3 gap-0.5 w-5 h-5">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
							<div key={dot} className="w-1 h-1 bg-gray-600 rounded-full" />
						))}
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80 p-4" sideOffset={8}>
				<div className="grid grid-cols-3 gap-4">
					{adminApps.map((app) => {
						const isActive = pathname === app.href;
						const Icon = app.icon;

						return (
							<Link
								key={app.name}
								href={app.href}
								onClick={() => setIsOpen(false)}
								className={cn(
									"flex flex-col items-center justify-center p-4 rounded-lg transition-colors hover:bg-gray-100",
									isActive && "bg-blue-50 text-blue-600",
								)}
							>
								<Icon
									className={cn("h-8 w-8 mb-2", isActive ? "text-blue-600" : "text-gray-600")}
								/>
								<span
									className={cn(
										"text-xs text-center font-medium leading-tight",
										isActive ? "text-blue-600" : "text-gray-700",
									)}
								>
									{app.name}
								</span>
							</Link>
						);
					})}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
