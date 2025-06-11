import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import Container from "@/components/ui/container";
import StatusCardList from "./_components/StatusCardList";
import ContactSection from "@/app/organizations/_components/ContactSection";
import { BackLink } from "@/components/custom/BackLink";

interface OrgStatus {
	id: string;
	name: string;
	status: string;
	typeName: string;
	timeAgo: string;
}

export default async function StatusPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/login");
	}

	// Fetch organizations requested by current user, including type
	const { data: orgs } = await supabase
		.schema("common")
		.from("organizations")
		.select("id, name, status, created_at, organization_types(name)")
		.eq("requested_by", user.id);

	const rows: OrgStatus[] = (orgs ?? []).map((org) => {
		const createdAt = org.created_at;
		let timeAgo = "";
		if (createdAt) {
			const diffMs = Date.now() - new Date(createdAt).getTime();
			const hours = Math.floor(diffMs / (1000 * 60 * 60));
			if (hours < 24) {
				timeAgo = `${hours}時間前`;
			} else {
				const days = Math.floor(hours / 24);
				timeAgo = `${days}日前`;
			}
		}
		return {
			id: org.id,
			name: org.name,
			status: org.status,
			typeName: org.organization_types?.name ?? "",
			timeAgo,
		};
	});

	return (
		<Container className="py-8">
			<BackLink href="/organizations" />
			<h1 className="text-xl font-bold mb-4">組織申請状況</h1>
			<StatusCardList data={rows} />
			<ContactSection />
		</Container>
	);
}
