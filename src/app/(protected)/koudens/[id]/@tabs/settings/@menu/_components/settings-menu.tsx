"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
	label: string;
	href: string;
}

const menuItems: MenuItem[] = [
	{ label: "一般設定", href: "general" },
	{ label: "メンバー", href: "members" },
	{ label: "関係性", href: "relationships" },
	{ label: "配送方法", href: "delivery-methods" },
	{ label: "返礼品", href: "return-items" },
];

interface SettingsMenuProps {
	koudenId: string;
}

/**
 * 設定画面のサイドメニューコンポーネント
 * - 各設定ページへのナビゲーションを提供
 * - 現在のページをハイライト表示
 */
export function SettingsMenu({ koudenId }: SettingsMenuProps) {
	const pathname = usePathname();

	return (
		<nav className="space-y-2 px-2 py-6">
			{menuItems.map((item) => {
				const href = `/koudens/${koudenId}/settings/${item.href}`;
				const isActive = pathname === href;

				return (
					<Button
						key={item.href}
						variant="ghost"
						className={cn("w-full justify-start", isActive && "bg-muted")}
						asChild
					>
						<Link href={href}>{item.label}</Link>
					</Button>
				);
			})}
		</nav>
	);
}
