import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Checks if the current user has access to organizations of the given type.
 * Redirects to login if not authenticated, or unauthorized if no membership.
 */
export async function requireOrganizationAccess(type: "funeral_company" | "gift_shop") {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/login");
	}

	// find type ID
	const { data: typeRecord } = await supabase
		.from("organization_types")
		.select("id")
		.eq("name", type)
		.single();
	const typeId = typeRecord?.id;
	if (!typeId) {
		redirect("/unauthorized");
	}

	// fetch organizations of this type
	const { data: orgs } = await supabase.from("organizations").select("id").eq("type_id", typeId);
	const orgIds = orgs?.map((o) => o.id) ?? [];

	// check membership
	const { data: memberships } = await supabase
		.from("organization_members")
		.select("organization_id")
		.in("organization_id", orgIds)
		.eq("user_id", user.id);

	if (!memberships || memberships.length === 0) {
		redirect("/unauthorized");
	}
}
