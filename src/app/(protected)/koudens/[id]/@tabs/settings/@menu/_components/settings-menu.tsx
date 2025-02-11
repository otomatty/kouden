"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, HeartHandshake, Truck, Gift } from "lucide-react";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface MenuItem {
	icon: React.ReactNode;
	label: string;
	href: string;
}

// 基本設定メニュー項目
const basicMenuItems: MenuItem[] = [
	{ label: "一般設定", href: "general", icon: <Settings /> },
	{ label: "メンバー", href: "members", icon: <Users /> },
];

// カスタマイズ可能なメニュー項目
const customizableMenuItems: MenuItem[] = [
	{ label: "関係性", href: "relationships", icon: <HeartHandshake /> },
	{ label: "配送方法", href: "delivery-methods", icon: <Truck /> },
	{ label: "返礼品", href: "return-items", icon: <Gift /> },
];

interface SettingsMenuProps {
	koudenId: string;
}

/**
 * 設定画面のサイドメニューコンポーネント
 * - 各設定ページへのナビゲーションを提供
 * - 現在のページをハイライト表示
 * - 基本設定とカスタマイズ可能な設定でグループ分け
 */
export function SettingsMenu({ koudenId }: SettingsMenuProps) {
	const pathname = usePathname();

	const renderMenuItems = (items: MenuItem[]) => {
		return items.map((item) => {
			const href = `/koudens/${koudenId}/settings/${item.href}`;
			const isActive = pathname === href;

			return (
				<SidebarMenuItem key={item.href}>
					<SidebarMenuButton asChild isActive={isActive} className="w-full justify-start">
						<Link href={href}>
							<div className="flex items-center gap-2">
								{item.icon}
								{item.label}
							</div>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			);
		});
	};

	return (
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>基本設定</SidebarGroupLabel>
				<SidebarMenu>{renderMenuItems(basicMenuItems)}</SidebarMenu>
			</SidebarGroup>

			<SidebarGroup>
				<SidebarGroupLabel>カスタマイズ設定</SidebarGroupLabel>
				<SidebarMenu>{renderMenuItems(customizableMenuItems)}</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
	);
}
