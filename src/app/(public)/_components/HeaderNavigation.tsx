"use client";

import React from "react";
import Link from "next/link";
import {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuTrigger,
	NavigationMenuContent,
	NavigationMenuLink,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Cloud, BarChart2, FileText, Monitor, Gift, Lock, LayoutDashboard } from "lucide-react";

/** サイトの機能とその詳細ページ */
const features = [
	{ id: "cloud-sync", title: "クラウド同期", href: "/features/cloud-sync", icon: Cloud },
	{
		id: "auto-calc-graph",
		title: "自動計算＆グラフ表示",
		href: "/features/auto-calc-graph",
		icon: BarChart2,
	},
	{ id: "export", title: "Excel/PDF出力", href: "/features/export", icon: FileText },
	{
		id: "multi-device",
		title: "あらゆる端末で使える",
		href: "/features/multi-device",
		icon: Monitor,
	},
	{
		id: "return-management",
		title: "香典返し管理",
		href: "/features/return-management",
		icon: Gift,
	},
	{
		id: "invite-security",
		title: "招待制セキュリティ",
		href: "/features/invite-security",
		icon: Lock,
	},
	{
		id: "dedicated-ui",
		title: "使いやすいUI",
		href: "/features/dedicated-ui",
		icon: LayoutDashboard,
	},
];

/** ヘッダーのその他ナビゲーションメニュー */
const otherNav = [
	{ name: "使い方", href: "/guide" },
	{ name: "使用例", href: "/use-cases" },
	{ name: "料金", href: "/pricing" },
];

export function HeaderNavigation() {
	return (
		<NavigationMenu>
			<NavigationMenuList className="hidden md:flex items-center space-x-6">
				{/* 機能のドロップダウン */}
				<NavigationMenuItem>
					<NavigationMenuTrigger>機能</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
							{features.map(({ id, title, href, icon: Icon }) => (
								<NavigationMenuLink asChild key={id}>
									<Link
										href={href}
										className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
									>
										<Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
										<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
											{title}
										</span>
									</Link>
								</NavigationMenuLink>
							))}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				{/* その他メニュー */}
				{otherNav.map((item) => (
					<NavigationMenuItem key={item.href}>
						<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
							<Link href={item.href}>{item.name}</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	);
}
