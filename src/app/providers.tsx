"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { OrganizationProvider } from "@/context/organization";

export function Providers({ children }: { children: React.ReactNode }) {
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
			<OrganizationProvider>{children}</OrganizationProvider>
		</QueryClientProvider>
	);
}
