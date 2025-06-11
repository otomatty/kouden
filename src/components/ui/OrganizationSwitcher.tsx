"use client";

import * as React from "react";
import { useOrganization } from "@/context/organization";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

export function OrganizationSwitcher() {
	const { orgs, selectedOrg, setSelectedOrg } = useOrganization();

	return (
		<Select
			value={selectedOrg?.id}
			onValueChange={(id) => {
				const org = orgs.find((o) => o.id === id);
				if (org) setSelectedOrg(org);
			}}
		>
			<SelectTrigger className="w-48">
				<SelectValue placeholder="組織を選択" />
			</SelectTrigger>
			<SelectContent>
				{orgs.map((o) => (
					<SelectItem key={o.id} value={o.id}>
						{o.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
