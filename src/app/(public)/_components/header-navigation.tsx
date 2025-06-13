"use client";

import type * as React from "react";
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
interface Feature {
	title: string;
	href: string;
	description: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
const features: Feature[] = [
	{
		title: "クラウド同期",
		href: "/features/cloud-sync",
		description: "クラウド上にデータを自動的に同期し、複数デバイスからいつでもアクセスできます。",
		icon: Cloud,
	},
	{
		title: "自動計算＆グラフ表示",
		href: "/features/auto-calc-graph",
		description: "入力したデータを自動で計算し、グラフで視覚的に分析できます。",
		icon: BarChart2,
	},
	{
		title: "Excel/PDF出力",
		href: "/features/export",
		description: "計算結果をExcelやPDF形式で簡単に出力できます。",
		icon: FileText,
	},
	{
		title: "あらゆる端末で使える",
		href: "/features/multi-device",
		description: "デスクトップからモバイルまで、あらゆるデバイスをサポートします。",
		icon: Monitor,
	},
	{
		title: "香典返し管理",
		href: "/features/return-management",
		description: "香典返しの管理を一元化し、スムーズに運用できます。",
		icon: Gift,
	},
	{
		title: "招待制セキュリティ",
		href: "/features/invite-security",
		description: "招待制を導入し、セキュリティを強化できます。",
		icon: Lock,
	},
	{
		title: "使いやすいUI",
		href: "/features/dedicated-ui",
		description: "直感的で見やすいUIを提供します。",
		icon: LayoutDashboard,
	},
];

/**
 * ナビゲーションメニューアイテム
 */
type NavItem =
	| { type: "link"; name: string; href: string }
	| { type: "dropdown"; name: string; items: typeof features };
const navItems: NavItem[] = [
	{ type: "link", name: "料金", href: "/pricing" },
	{ type: "dropdown", name: "機能", items: features },
	{ type: "link", name: "使い方", href: "/guide" },
	{ type: "link", name: "企業", href: "/enterprise" },
];

export function HeaderNavigation() {
	return (
		<NavigationMenu>
			<NavigationMenuList className="hidden md:flex items-center">
				{navItems.map((item) => {
					return item.type === "link" ? (
						<NavigationMenuItem key={item.href}>
							<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
								<Link href={item.href}>{item.name}</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					) : (
						<NavigationMenuItem key={item.name}>
							<NavigationMenuTrigger>{item.name}</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid gap-2 md:w-[400px] lg:w-[600px] lg:grid-cols-2">
									{item.items.map((feature) => (
										<ListItem
											key={feature.href}
											icon={feature.icon}
											title={feature.title}
											href={feature.href}
										>
											{feature.description}
										</ListItem>
									))}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>
					);
				})}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

/**
 * リストアイテムコンポーネント
 */
function ListItem({
	icon: Icon,
	title,
	children,
	href,
	...props
}: React.ComponentPropsWithoutRef<"li"> & {
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
	return (
		<li {...props}>
			<NavigationMenuLink asChild>
				<Link
					href={href}
					className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<div className="flex items-center gap-4">
						<div className="flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-4 w-12 h-12">
							<Icon className=" text-gray-700 dark:text-gray-300" />
						</div>
						<div className="flex flex-col flex-1">
							{title}
							<p className="text-muted-foreground text-sm leading-snug">{children}</p>
						</div>
					</div>
				</Link>
			</NavigationMenuLink>
		</li>
	);
}
