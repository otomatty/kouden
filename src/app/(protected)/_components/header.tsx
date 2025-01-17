"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface HeaderProps {
	user: User;
}

export function Header({ user }: HeaderProps) {
	const router = useRouter();
	const supabase = createClient();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.refresh();
	};

	return (
		<header className="bg-white shadow">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<Link href="/koudens" className="hover:opacity-80 transition-opacity">
						<h1 className="text-xl font-semibold">香典帳アプリ</h1>
					</Link>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarImage src={user.user_metadata.avatar_url} />
								<AvatarFallback>
									{user.email?.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm text-gray-600">{user.email}</span>
						</div>
						<Button variant="outline" onClick={handleSignOut}>
							ログアウト
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
