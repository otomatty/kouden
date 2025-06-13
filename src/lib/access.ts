import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Debug helper: Get detailed organization and membership info for a user
 * @param userId - User ID to check
 * @returns Debug information about user's organizations and memberships
 */
export async function debugUserOrganizationAccess(userId: string) {
	const supabase = await createClient();

	try {
		// Get all organization types
		const { data: allTypes, error: typesError } = await supabase
			.schema("common")
			.from("organization_types")
			.select("*");

		// Get all organizations
		const { data: allOrgs, error: orgsError } = await supabase
			.schema("common")
			.from("organizations")
			.select("*, organization_types(name)");

		// Get user's memberships
		const { data: userMemberships, error: membershipsError } = await supabase
			.schema("common")
			.from("organization_members")
			.select("*, organizations(name, status, organization_types(name))")
			.eq("user_id", userId);

		return {
			userId,
			allTypes: allTypes || [],
			allOrganizations: allOrgs || [],
			userMemberships: userMemberships || [],
			errors: {
				typesError,
				orgsError,
				membershipsError,
			},
		};
	} catch (error) {
		console.error("[debugUserOrganizationAccess] Error:", error);
		return { error };
	}
}

/**
 * Checks if the current user has access to organizations of the given type.
 * Redirects to login if not authenticated, or unauthorized if no membership.
 */
export async function requireOrganizationAccess(type: "funeral_company" | "gift_shop") {
	const supabase = await createClient();

	try {
		// Step 1: Check authentication
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) {
			console.error("[requireOrganizationAccess] Auth error:", authError);
			redirect("/login");
		}

		if (!user) {
			console.warn("[requireOrganizationAccess] No user found");
			redirect("/login");
		}

		// Step 2: Find organization type ID
		const { data: typeRecord, error: typeError } = await supabase
			.schema("common")
			.from("organization_types")
			.select("id, name, slug")
			.eq("slug", type)
			.single();

		if (typeError) {
			console.error("[requireOrganizationAccess] Error fetching organization type:", typeError);
			console.error("Type query details:", { type, schema: "common", table: "organization_types" });

			// Get debug info when type lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Debug info:", debugInfo);

			redirect("/unauthorized");
		}

		const typeId = typeRecord?.id;
		if (!typeId) {
			console.error(`[requireOrganizationAccess] Organization type '${type}' not found`);

			// Get debug info when type not found
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Debug info:", debugInfo);

			redirect("/unauthorized");
		}

		// Step 3: Fetch organizations of this type (only active ones)
		const { data: orgs, error: orgsError } = await supabase
			.schema("common")
			.from("organizations")
			.select("id, name, status")
			.eq("type_id", typeId)
			.eq("status", "active");

		if (orgsError) {
			console.error("[requireOrganizationAccess] Error fetching organizations:", orgsError);

			// Get debug info when org lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Debug info:", debugInfo);

			redirect("/unauthorized");
		}

		const orgIds = orgs?.map((o) => o.id) ?? [];

		if (orgIds.length === 0) {
			console.warn(`[requireOrganizationAccess] No organizations found for type '${type}'`);

			// Get debug info when no orgs found
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Debug info:", debugInfo);

			redirect("/unauthorized");
		}

		// Step 4: Check user membership
		const { data: memberships, error: membershipError } = await supabase
			.schema("common")
			.from("organization_members")
			.select("organization_id, role")
			.in("organization_id", orgIds)
			.eq("user_id", user.id);

		if (membershipError) {
			console.error("[requireOrganizationAccess] Error fetching memberships:", membershipError);

			// Get debug info when membership lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Debug info:", debugInfo);

			redirect("/unauthorized");
		}

		if (!memberships || memberships.length === 0) {
			console.warn(
				`[requireOrganizationAccess] User ${user.id} has no membership in organizations of type '${type}'`,
			);

			// Get comprehensive debug info when access denied
			const debugInfo = await debugUserOrganizationAccess(user.id);
			console.error("[requireOrganizationAccess] Comprehensive debug info:", debugInfo);

			redirect("/unauthorized");
		}
	} catch (error) {
		console.error("[requireOrganizationAccess] Unexpected error:", error);
		redirect("/unauthorized");
	}
}
