"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuGroup,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
	user: User;
	isAdmin: boolean;
}

export function UserMenu({ user, isAdmin }: UserMenuProps) {
	const router = useRouter();
	const supabase = createClient();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="relative flex items-center gap-3 h-auto px-4 py-2">
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
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>アカウント</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => router.push("/profile")}>
						<UserIcon className="mr-2 h-4 w-4" />
						プロフィール
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => router.push("/settings")}>
						<Settings className="mr-2 h-4 w-4" />
						設定
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				{isAdmin && (
					<>
						<DropdownMenuLabel>管理者</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => router.push("/admin")}>
							<ShieldCheck className="mr-2 h-4 w-4" />
							管理者ページ
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
					<LogOut className="mr-2 h-4 w-4" />
					ログアウト
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
