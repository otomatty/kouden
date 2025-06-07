"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, HeartHandshake, Truck, Gift } from "lucide-react";

interface MenuItem {
	icon: React.ReactNode;
	label: string;
	href: string;
}

// 基本設定メニュー項目
const basicMenuItems: MenuItem[] = [
	{ label: "一般設定", href: "general", icon: <Settings /> },
	{ label: "メンバー", href: "members", icon: <Users /> },
	{ label: "プラン管理", href: "plan-upgrade", icon: <Truck /> },
];

// カスタマイズ可能なメニュー項目
const customizableMenuItems: MenuItem[] = [
	{ label: "関係性", href: "relationships", icon: <HeartHandshake /> },
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
				<li key={item.href}>
					<Link
						href={href}
						className={cn(
							"flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
							"hover:bg-gray-100 dark:hover:bg-gray-800",
							isActive
								? "bg-gray-100 dark:bg-gray-800 text-primary font-medium"
								: "text-gray-700 dark:text-gray-300",
						)}
					>
						<span className="w-5 h-5">{item.icon}</span>
						<span>{item.label}</span>
					</Link>
				</li>
			);
		});
	};

	return (
		<nav className="w-64 h-full py-4 border-r border-border">
			<div className="space-y-6">
				<div>
					<h3 className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400">基本設定</h3>
					<ul className="mt-2 space-y-1">{renderMenuItems(basicMenuItems)}</ul>
				</div>

				<div>
					<h3 className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
						カスタマイズ設定
					</h3>
					<ul className="mt-2 space-y-1">{renderMenuItems(customizableMenuItems)}</ul>
				</div>
			</div>
		</nav>
	);
}
