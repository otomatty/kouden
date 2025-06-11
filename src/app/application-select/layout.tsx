import type { ReactNode } from "react";
import AppSelectHeader from "./_components/app-select-header";
import { createClient } from "@/lib/supabase/server";
import pkg from "../../../package.json";

const version = pkg.version;

export default async function OrganizationsLayout({ children }: { children: ReactNode }) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<div className="min-h-screen flex flex-col">
			<AppSelectHeader user={user} version={version} />
			<main className="flex-1">{children}</main>
		</div>
	);
}
