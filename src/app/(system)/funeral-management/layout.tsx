import { requireOrganizationAccess } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/app/_actions/admin/admin-users";
import { SystemHeader } from "@/components/ui/system-header";
import type { ReactNode } from "react";

// Version fetched from environment variable
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export default async function FuneralManagementLayout({ children }: { children: ReactNode }) {
	await requireOrganizationAccess("funeral_company");

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated");
	}

	// 管理者権限の確認
	const isAdminUser = await isAdmin();

	return (
		<div>
			<SystemHeader user={user} isAdmin={isAdminUser} version={version} systemType="funeral" />
			{children}
		</div>
	);
}
