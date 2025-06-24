"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OrganizationProvider } from "@/context/organization";
import { AuthProvider } from "@/components/providers/auth-provider";
import type { User } from "@supabase/supabase-js";

interface ProvidersProps {
	children: React.ReactNode;
	initialUser?: User | null;
}

export function Providers({ children, initialUser }: ProvidersProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
						retry: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider initialUser={initialUser || null}>
				<OrganizationProvider>{children}</OrganizationProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
