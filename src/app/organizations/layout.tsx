import type { ReactNode } from "react";
import OrganizationsHeader from "./_components/organizations-header";
import { createClient } from "@/lib/supabase/server";

// Version fetched from environment variable
const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export default async function OrganizationsLayout({ children }: { children: ReactNode }) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<div className="min-h-screen flex flex-col">
			<OrganizationsHeader user={user} version={version} />
			<main className="flex-1">{children}</main>
		</div>
	);
}
