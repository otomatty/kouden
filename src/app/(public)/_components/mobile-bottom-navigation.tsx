"use client";

import Link from "next/link";
import type React from "react";
import { CreditCard, SlidersHorizontal, BookOpen, Briefcase } from "lucide-react";

interface NavItem {
	name: string;
	href: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
	{ name: "料金", href: "/pricing", icon: CreditCard },
	{ name: "機能", href: "/features", icon: SlidersHorizontal },
	{ name: "使い方", href: "/guide", icon: BookOpen },
	{ name: "企業", href: "/enterprise", icon: Briefcase },
];

/**
 * モバイル表示時の画面下部ナビゲーションコンポーネント
 */
export function MobileBottomNavigation() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
			<ul className="flex justify-around p-1">
				{navItems.map((item) => (
					<li key={item.href}>
						<Link
							href={item.href}
							className="flex flex-col items-center py-2 text-gray-600 hover:text-gray-900"
						>
							<item.icon className="h-5 w-5 mb-1 text-gray-600 hover:text-gray-900" />
							<span className="text-xs">{item.name}</span>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
