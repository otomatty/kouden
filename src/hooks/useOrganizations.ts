import { useQuery } from "@tanstack/react-query";

type Org = {
	id: string;
	name: string;
};

export function useOrganizations() {
	return useQuery<Org[]>({
		queryKey: ["organizations"],
		queryFn: async () => {
			const res = await fetch("/api/organizations/mine");
			if (!res.ok) {
				throw new Error("Failed to fetch organizations");
			}
			const data = await res.json();
			return data.orgs as Org[];
		},
	});
}
