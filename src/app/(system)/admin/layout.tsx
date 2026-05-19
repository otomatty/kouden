import { CSRFProvider } from "@/components/providers/csrf-provider";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminHeader } from "./_components/admin-header";

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	// RPC エラーは権限不足ではなく DB エラーとして扱う (上位で 500 化)
	if (rpcError) {
		throw new Error(`管理者権限の確認に失敗しました: ${rpcError.message}`);
	}

	if (!isAdmin) {
		redirect("/");
	}

	return (
		<CSRFProvider>
			<div className="min-h-screen bg-gray-50">
				<AdminHeader user={user} />
				<Container className="mx-auto px-6 py-8">{children}</Container>
			</div>
		</CSRFProvider>
	);
}
