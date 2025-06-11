import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useOrganizations } from "@/hooks/useOrganizations";

interface Org {
	id: string;
	name: string;
}

interface OrganizationContextValue {
	orgs: Org[];
	selectedOrg: Org | null;
	setSelectedOrg: (org: Org) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { data: orgs = [], isLoading } = useOrganizations();
	const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);

	useEffect(() => {
		if (isLoading) return;
		if (selectedOrg) return;
		const firstOrg = orgs[0];
		if (!firstOrg) return;
		setSelectedOrg(firstOrg);
	}, [isLoading, orgs, selectedOrg]);

	if (isLoading) return null;

	return (
		<OrganizationContext.Provider value={{ orgs, selectedOrg, setSelectedOrg }}>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	const context = useContext(OrganizationContext);
	if (!context) throw new Error("useOrganization must be used within OrganizationProvider");
	return context;
}
