"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AdminHeaderProps {
	user: User;
}

export function AdminHeader({ user }: AdminHeaderProps) {
	const router = useRouter();
	const supabase = createClient();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.refresh();
	};

	return (
		<header className="bg-white shadow">
			<div className="flex h-16 items-center justify-between px-4">
				<button
					type="button"
					className="md:hidden p-2 text-gray-500 hover:text-gray-600"
				>
					<Menu className="h-6 w-6" />
				</button>

				<div className="flex items-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center gap-2">
								<span className="hidden md:block">{user.email}</span>
								<div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
									{user.email?.[0].toUpperCase()}
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleSignOut}>
								ログアウト
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
