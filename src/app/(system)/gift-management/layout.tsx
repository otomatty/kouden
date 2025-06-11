import { requireOrganizationAccess } from "@/lib/access";
import { OrganizationSwitcher } from "@/components/ui/OrganizationSwitcher";
import type { ReactNode } from "react";

export default async function GiftManagementLayout({ children }: { children: ReactNode }) {
	await requireOrganizationAccess("gift_shop");
	return (
		<div>
			<header className="p-4 border-b">
				<OrganizationSwitcher />
			</header>
			{children}
		</div>
	);
}
