"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/context/organization";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

export function OrganizationSwitcher() {
	const router = useRouter();
	const { filteredOrgs, selectedOrg, setSelectedOrg } = useOrganization();

	const handleOrganizationChange = (id: string) => {
		const org = filteredOrgs.find((o) => o.id === id);
		if (!org) return;

		setSelectedOrg(org);

		// 組織タイプに応じてシステムを切り替え
		const systemRoutes = {
			funeral_company: "/funeral-management",
			gift_shop: "/gift-management",
		};

		const targetRoute = systemRoutes[org.type as keyof typeof systemRoutes];
		if (targetRoute) {
			router.push(targetRoute);
		}
	};

	return (
		<Select value={selectedOrg?.id} onValueChange={handleOrganizationChange}>
			<SelectTrigger className="w-48">
				<SelectValue placeholder="組織を選択" />
			</SelectTrigger>
			<SelectContent>
				{filteredOrgs.map((o) => (
					<SelectItem key={o.id} value={o.id}>
						{o.name}
						{o.type && (
							<span className="ml-2 text-xs text-gray-500">
								(
								{o.type === "funeral_company" ? "葬儀" : o.type === "gift_shop" ? "ギフト" : o.type}
								)
							</span>
						)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
