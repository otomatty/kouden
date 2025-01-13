"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

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
					<h1 className="text-xl font-semibold">葬儀会計アプリ</h1>
					<div className="flex items-center gap-4">
						<span className="text-sm text-gray-600">{user.email}</span>
						<Button variant="outline" onClick={handleSignOut}>
							ログアウト
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
