import { redirect } from "next/navigation";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

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
		logger.error(
			{
				userId,
				error: error instanceof Error ? error.message : String(error),
			},
			"[debugUserOrganizationAccess] Error",
		);
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
			logger.error(
				{
					error: authError.message,
					type,
				},
				"[requireOrganizationAccess] Auth error",
			);
			redirect("/login");
		}

		if (!user) {
			logger.warn({ type }, "[requireOrganizationAccess] No user found");
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
			logger.error(
				{
					error: typeError.message,
					code: typeError.code,
					type,
					schema: "common",
					table: "organization_types",
				},
				"[requireOrganizationAccess] Error fetching organization type",
			);

			// Get debug info when type lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Debug info",
			);

			redirect("/unauthorized");
		}

		const typeId = typeRecord?.id;
		if (!typeId) {
			logger.error(
				{
					type,
					userId: user.id,
				},
				`[requireOrganizationAccess] Organization type '${type}' not found`,
			);

			// Get debug info when type not found
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Debug info",
			);

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
			logger.error(
				{
					error: orgsError.message,
					code: orgsError.code,
					type,
					typeId,
					userId: user.id,
				},
				"[requireOrganizationAccess] Error fetching organizations",
			);

			// Get debug info when org lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Debug info",
			);

			redirect("/unauthorized");
		}

		const orgIds = orgs?.map((o) => o.id) ?? [];

		if (orgIds.length === 0) {
			logger.warn(
				{
					type,
					typeId,
					userId: user.id,
				},
				`[requireOrganizationAccess] No organizations found for type '${type}'`,
			);

			// Get debug info when no orgs found
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Debug info",
			);

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
			logger.error(
				{
					error: membershipError.message,
					code: membershipError.code,
					type,
					userId: user.id,
					orgIds,
				},
				"[requireOrganizationAccess] Error fetching memberships",
			);

			// Get debug info when membership lookup fails
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Debug info",
			);

			redirect("/unauthorized");
		}

		if (!memberships || memberships.length === 0) {
			logger.warn(
				{
					userId: user.id,
					type,
					orgIds,
				},
				`[requireOrganizationAccess] User has no membership in organizations of type '${type}'`,
			);

			// Get comprehensive debug info when access denied
			const debugInfo = await debugUserOrganizationAccess(user.id);
			logger.error(
				{
					userId: user.id,
					type,
					debugInfo,
				},
				"[requireOrganizationAccess] Comprehensive debug info",
			);

			redirect("/unauthorized");
		}
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				type,
			},
			"[requireOrganizationAccess] Unexpected error",
		);
		redirect("/unauthorized");
	}
}
