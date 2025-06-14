import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "./_components/admin-header";
import Container from "@/components/ui/container";

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
		<div className="min-h-screen bg-gray-50">
			<AdminHeader user={user} />
			<Container className="mx-auto px-6 py-8">{children}</Container>
		</div>
	);
}
