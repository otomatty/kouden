"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
	LogOut,
	Menu,
	ShieldCheck,
	User as UserIcon,
	BookOpen,
	PlayCircle,
	Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import { useState } from "react";
import { UserMenu } from "./user-menu";
import { NotificationsPopover } from "./notifications-popover";
import { FeedbackButton } from "@/components/custom/feedback-button";
import { GuideMenu } from "./guide-menu";
import type { NotificationItem } from "@/types/notifications";

interface HeaderProps {
	user: User;
	isAdmin: boolean;
	version: string;
	notifications: NotificationItem[];
}

export function Header({ user, isAdmin, version, notifications }: HeaderProps) {
	const router = useRouter();
	const supabase = createClient();
	const [isOpen, setIsOpen] = useState(false);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<header className="bg-white shadow" data-tour="header">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<Link href="/koudens" className="hover:opacity-80 transition-opacity">
						<h1 className="text-xl font-semibold flex items-center gap-2">
							香典帳
							<span className="text-xs">β版</span>
							<span className="text-xs">v{version}</span>
						</h1>
					</Link>
					{/* デスクトップ表示 */}
					<div className="hidden md:flex items-center space-x-6">
						<div className="flex items-center space-x-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-block">
										<NotificationsPopover notifications={notifications} />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>通知</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-block">
										<GuideMenu />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>操作方法</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<UserMenu user={user} isAdmin={isAdmin} />
					</div>
					{/* モバイル表示 */}
					<div className="md:hidden flex items-center gap-1 md:gap-2">
						<NotificationsPopover notifications={notifications} />
						<GuideMenu />
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon">
									<Menu className="h-6 w-6" />
								</Button>
							</SheetTrigger>
							<SheetContent>
								<SheetHeader>
									<SheetTitle>メニュー</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col justify-between h-[calc(100%-28px)] gap-2">
									<div className="flex flex-col gap-4 mt-6">
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarImage src={user.user_metadata.avatar_url} />
												<AvatarFallback>
													{user.user_metadata.full_name?.charAt(0).toUpperCase() ||
														user.email?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm text-gray-600">
												{user.user_metadata.full_name || user.email}
											</span>
										</div>
										<Button
											variant="ghost"
											className="justify-start"
											onClick={() => {
												router.push("/profile");
												setIsOpen(false);
											}}
										>
											<UserIcon className="mr-2 h-4 w-4" />
											プロフィール
										</Button>
										<Button
											variant="ghost"
											className="justify-start"
											onClick={() => {
												router.push("/manuals/tour");
												setIsOpen(false);
											}}
										>
											<Settings className="mr-2 h-4 w-4" />
											ユーザー設定
										</Button>
										{isAdmin && (
											<Button
												variant="ghost"
												className="justify-start"
												onClick={() => {
													router.push("/admin");
													setIsOpen(false);
												}}
											>
												<ShieldCheck className="mr-2 h-4 w-4" />
												管理者ページ
											</Button>
										)}
										<Button
											variant="ghost"
											className="justify-start"
											onClick={() => {
												router.push("/manuals/tour");
												setIsOpen(false);
											}}
										>
											<PlayCircle className="mr-2 h-4 w-4" />
											ツアーを開始
										</Button>
										<Button
											variant="ghost"
											className="justify-start"
											onClick={() => {
												router.push("/manuals");
												setIsOpen(false);
											}}
										>
											<BookOpen className="mr-2 h-4 w-4" />
											使い方マニュアル
										</Button>
									</div>
									<div className="mt-auto flex flex-col gap-2">
										<FeedbackButton user={user} />
										<Separator />
										<Button variant="outline" className="justify-start" onClick={handleSignOut}>
											<LogOut className="mr-2 h-4 w-4" />
											ログアウト
										</Button>
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</header>
	);
}
