import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/app/_actions/invitations";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = await cookies();
	const invitationToken = cookieStore.get("invitation_token")?.value;

	try {
		const supabase = await createClient();

		if (code) {
			const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
			if (authError) {
				console.error("Auth error during exchange:", authError);
				return Response.redirect(new URL("/auth/login", requestUrl.origin));
			}
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return Response.redirect(new URL("/auth/login", requestUrl.origin));
		}

		if (invitationToken) {
			try {
				await acceptInvitation(invitationToken);
				cookieStore.delete("invitation_token");
			} catch (error) {
				console.error("Error accepting invitation:", error);
				const errorMessage = error instanceof Error ? error.message : "不明なエラー";
				return Response.redirect(
					new URL(`/invitation-error?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin),
				);
			}
		}

		return Response.redirect(new URL("/koudens", requestUrl.origin));
	} catch (error) {
		console.error("Error in auth callback:", error);
		return Response.redirect(new URL("/auth/login", requestUrl.origin));
	}
}
