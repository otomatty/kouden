"use client";

import type React from "react";
import { PermissionProvider } from "./permission-provider";
import { NavigationModeProvider } from "@/context/navigation-mode";
import type { KoudenPermission } from "@/types/role";

interface ClientProvidersProps {
	permission: KoudenPermission;
	children: React.ReactNode;
}

export default function ClientProviders({ permission, children }: ClientProvidersProps) {
	return (
		<PermissionProvider permission={permission}>
			<NavigationModeProvider value="detail">{children}</NavigationModeProvider>
		</PermissionProvider>
	);
}
