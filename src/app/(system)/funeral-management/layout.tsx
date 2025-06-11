import { requireOrganizationAccess } from "@/lib/access";
import { OrganizationSwitcher } from "@/components/ui/OrganizationSwitcher";
import type { ReactNode } from "react";

export default async function FuneralManagementLayout({ children }: { children: ReactNode }) {
	await requireOrganizationAccess("funeral_company");
	return (
		<div>
			<header className="p-4 border-b">
				<OrganizationSwitcher />
			</header>
			{children}
		</div>
	);
}
