import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { debugUserOrganizationAccess } from "@/lib/access";

/**
 * Debug endpoint to check user's organization access
 * GET /api/debug/organization-access
 */
export async function GET() {
	try {
		const supabase = await createClient();

		// Get current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Not authenticated", authError }, { status: 401 });
		}

		// Get debug information
		const debugInfo = await debugUserOrganizationAccess(user.id);

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
			},
			debugInfo,
		});
	} catch (error) {
		console.error("[Debug API] Error:", error);
		return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
	}
}
