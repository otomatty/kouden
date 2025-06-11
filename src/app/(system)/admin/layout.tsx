import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminHeader } from "./_components/admin-header";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (!isAdmin) {
		redirect("/");
	}

	return (
		<div className="flex h-screen bg-gray-100">
			<AdminSidebar />
			<div className="flex-1 flex flex-col overflow-hidden">
				<AdminHeader user={user} />
				<main className="flex-1 overflow-y-auto p-4">{children}</main>
			</div>
		</div>
	);
}
