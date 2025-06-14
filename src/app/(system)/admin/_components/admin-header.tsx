"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { AdminAppsMenu } from "./admin-apps-menu";
import { LayoutDashboard, Briefcase, Users, FileText, LifeBuoy } from "lucide-react";

interface AdminHeaderProps {
	user: User;
}

// 主要なナビゲーション項目（タブとして表示）
const mainNavigation = [
	{ name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
	{ name: "組織管理", href: "/admin/organizations", icon: Briefcase },
	{ name: "管理者", href: "/admin/users", icon: Users },
	{ name: "オウンドメディア", href: "/admin/blog", icon: FileText },
	{ name: "サポート", href: "/admin/support", icon: LifeBuoy },
];

export function AdminHeader({ user }: AdminHeaderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const supabase = createClient();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<header className="bg-white border-b border-gray-200">
			{/* メインヘッダー */}
			<Container className="flex h-16 items-center justify-between px-6">
				{/* 左側：タイトル */}
				<div className="flex items-center">
					<h1 className="text-xl font-semibold text-gray-900">管理画面</h1>
				</div>

				{/* 右側：9ドットメニュー + ユーザーメニュー */}
				<div className="flex items-center gap-2">
					<AdminAppsMenu />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center gap-2 h-9">
								<div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
									{user.email?.[0]?.toUpperCase()}
								</div>
								<span className="hidden md:block text-sm font-medium">{user.email}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuItem onClick={handleSignOut}>ログアウト</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</Container>

			{/* ナビゲーションタブ */}
			<div className="border-b border-gray-200">
				<Container className="flex px-6">
					{mainNavigation.map((item) => {
						const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
						const Icon = item.icon;

						return (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
									isActive
										? "border-blue-600 text-blue-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
								)}
							>
								<Icon className="h-4 w-4" />
								<span className="hidden sm:block">{item.name}</span>
							</Link>
						);
					})}
				</Container>
			</div>
		</header>
	);
}
