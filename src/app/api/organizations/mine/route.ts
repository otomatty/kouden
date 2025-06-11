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
		.from("organization_members")
		.select("organization_id")
		.eq("user_id", user.id);
	const orgIds = memberships?.map((m) => m.organization_id) ?? [];
	// fetch active organizations
	const { data: orgs } = await supabase
		.from("organizations")
		.select("id, name")
		.in("id", orgIds)
		.eq("status", "active");

	return NextResponse.json({ orgs: orgs ?? [] });
}
