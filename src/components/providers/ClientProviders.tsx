"use client";

import type React from "react";
import { PermissionProvider } from "./permission-provider";
import { NavigationModeProvider } from "@/context/navigation-mode";
import { CSRFProvider } from "./csrf-provider";
import type { KoudenPermission } from "@/types/role";

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
