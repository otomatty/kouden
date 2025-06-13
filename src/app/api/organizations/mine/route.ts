import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ orgs: [] });
	}
	// get membership org IDs
	const { data: memberships } = await supabase
		.schema("common")
		.from("organization_members")
		.select("organization_id")
		.eq("user_id", user.id);
	const orgIds = memberships?.map((m) => m.organization_id) ?? [];
	// fetch active organizations with type information
	const { data: orgs } = await supabase
		.schema("common")
		.from("organizations")
		.select(`
			id, 
			name,
			organization_types(slug)
		`)
		.in("id", orgIds)
		.eq("status", "active");

	// Transform the data to include type information
	const transformedOrgs =
		orgs?.map((org) => ({
			id: org.id,
			name: org.name,
			type: org.organization_types?.slug || null,
		})) ?? [];

	return NextResponse.json({ orgs: transformedOrgs });
}
