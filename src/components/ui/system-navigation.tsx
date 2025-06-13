"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavigationItem, NavigationSection } from "@/config/navigation/types";

interface SystemNavigationProps {
	sections: NavigationSection[];
	quickAccess?: NavigationItem[];
	className?: string;
}

/**
 * システム共通のナビゲーションコンポーネント
 * デスクトップではドロップダウンメニュー、モバイルではサイドシート
 */
export function SystemNavigation({ sections, quickAccess, className }: SystemNavigationProps) {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	const isActiveLink = (href: string) => {
		if (href === "/funeral-management" || href === "/gift-management") {
			return pathname === href;
		}
		return pathname.startsWith(href);
	};

	// デスクトップ用のドロップダウンメニュー
	const DesktopNavigation = () => (
		<NavigationMenu className={cn("hidden md:flex", className)}>
			<NavigationMenuList>
				{/* クイックアクセスメニュー */}
				{quickAccess?.map((item) => (
					<NavigationMenuItem key={item.href}>
						<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
							<Link
								href={item.href}
								className={cn(
									"flex items-center gap-2",
									isActiveLink(item.href) && "bg-accent text-accent-foreground",
								)}
							>
								<item.icon className="h-4 w-4" />
								{item.title}
								{item.badge && (
									<Badge variant="secondary" className="text-xs">
										{item.badge}
									</Badge>
								)}
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				))}

				{/* 全メニューのドロップダウン */}
				<NavigationMenuItem>
					<NavigationMenuTrigger className="flex items-center gap-1">
						<Menu className="h-4 w-4" />
						すべての機能
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div className="grid gap-3 p-6 md:w-[500px] lg:w-[700px] lg:grid-cols-2">
							{sections.map((section) => (
								<div key={section.title} className="space-y-3">
									<h4 className="text-sm font-medium text-muted-foreground">{section.title}</h4>
									<div className="space-y-1">
										{section.items.map((item) => (
											<NavigationMenuLink key={item.href} asChild>
												<Link
													href={item.href}
													className={cn(
														"block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
														isActiveLink(item.href) && "bg-accent text-accent-foreground",
													)}
												>
													<div className="flex items-center gap-2">
														<item.icon className="h-4 w-4" />
														<div className="text-sm font-medium leading-none">{item.title}</div>
														{item.badge && (
															<Badge variant="secondary" className="text-xs">
																{item.badge}
															</Badge>
														)}
													</div>
													{item.description && (
														<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
															{item.description}
														</p>
													)}
												</Link>
											</NavigationMenuLink>
										))}
									</div>
								</div>
							))}
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);

	// モバイル用のサイドシート
	const MobileNavigation = () => (
		<div className="md:hidden">
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetTrigger asChild>
					<Button variant="ghost" size="sm">
						<Menu className="h-5 w-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-[300px] overflow-y-auto">
					<SheetHeader>
						<SheetTitle>メニュー</SheetTitle>
					</SheetHeader>
					<div className="mt-6 space-y-6">
						{sections.map((section) => (
							<div key={section.title} className="space-y-3">
								<h4 className="text-sm font-medium text-muted-foreground px-2">{section.title}</h4>
								<div className="space-y-1">
									{section.items.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setIsOpen(false)}
											className={cn(
												"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
												isActiveLink(item.href) && "bg-accent text-accent-foreground",
											)}
										>
											<item.icon className="h-4 w-4" />
											<div className="flex-1">
												<div className="flex items-center gap-2">
													{item.title}
													{item.badge && (
														<Badge variant="secondary" className="text-xs">
															{item.badge}
														</Badge>
													)}
												</div>
												{item.description && (
													<p className="text-xs text-muted-foreground mt-1">{item.description}</p>
												)}
											</div>
										</Link>
									))}
								</div>
							</div>
						))}
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);

	return (
		<div className="flex items-center">
			<DesktopNavigation />
			<MobileNavigation />
		</div>
	);
}
