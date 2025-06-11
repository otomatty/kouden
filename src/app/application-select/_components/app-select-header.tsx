+"use client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Container from "@/components/ui/container";
import { UserMenu } from "@/app/(protected)/_components/user-menu";

interface OrganizationsHeaderProps {
	user: User | null;
	version: string;
}

export default function OrganizationsHeader({ user, version }: OrganizationsHeaderProps) {
	return (
		<header className="bg-white border-b px-4 py-4">
			<Container>
				<div className="flex justify-between items-center">
					<Link href="/" className="text-xl font-bold flex items-center">
						<span>香典帳</span>
						<span className="text-sm text-gray-500 ml-1">β版</span>
						<span className="text-sm text-gray-500 ml-1">v{version}</span>
					</Link>
					<div>
						{user ? (
							<UserMenu user={user} isAdmin={false} />
						) : (
							<Link href="/auth/login" className="text-blue-500">
								ログイン
							</Link>
						)}
					</div>
				</div>
			</Container>
		</header>
	);
}
