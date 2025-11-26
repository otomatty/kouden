"use client";

import { NavigationModeProvider } from "@/context/navigation-mode";
import type { KoudenPermission } from "@/types/role";
import type React from "react";
import { CSRFProvider } from "./csrf-provider";
import { PermissionProvider } from "./permission-provider";

interface ClientProvidersProps {
	permission: KoudenPermission;
	children: React.ReactNode;
}

export default function ClientProviders({ permission, children }: ClientProvidersProps) {
	return (
		<CSRFProvider>
			<PermissionProvider permission={permission}>
				<NavigationModeProvider value="detail">{children}</NavigationModeProvider>
			</PermissionProvider>
		</CSRFProvider>
	);
}
