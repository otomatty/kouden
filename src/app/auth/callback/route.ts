import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/app/_actions/invitations";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = await cookies();
	const invitationToken = cookieStore.get("invitation_token")?.value;

	// デバッグ情報をログ出力
	console.log("[DEBUG] Callback URL:", request.url);
	console.log("[DEBUG] Auth Code:", code ? "Present" : "Not present");
	console.log("[DEBUG] Invitation Token from cookie:", invitationToken);
	console.log("[DEBUG] All cookies:", await cookieStore.getAll());

	try {
		const supabase = await createClient();

		if (code) {
			console.log("[DEBUG] Exchanging code for session");
			const { error: authError } =
				await supabase.auth.exchangeCodeForSession(code);
			if (authError) {
				console.error("[DEBUG] Auth error during exchange:", authError);
				return redirect("/login");
			}
			console.log("[DEBUG] Successfully exchanged code for session");
		}

		const {
			data: { session },
		} = await supabase.auth.getSession();

		console.log("[DEBUG] Session status:", session ? "Active" : "No session");

		if (!session?.user) {
			console.log("[DEBUG] No user session, redirecting to login");
			return redirect("/login");
		}

		console.log("[DEBUG] User ID:", session.user.id);

		if (invitationToken) {
			console.log("[DEBUG] Processing invitation token:", invitationToken);
			try {
				await acceptInvitation(invitationToken);
				console.log("[DEBUG] Successfully accepted invitation");
				cookieStore.delete("invitation_token");
				console.log("[DEBUG] Deleted invitation token cookie");
			} catch (error) {
				console.error("[DEBUG] Error accepting invitation:", error);
				const errorMessage =
					error instanceof Error ? error.message : "不明なエラー";
				return redirect(
					`/invitation-error?error=${encodeURIComponent(errorMessage)}`,
				);
			}
		} else {
			console.log("[DEBUG] No invitation token found in cookies");
		}

		return redirect("/koudens");
	} catch (error) {
		console.error("[DEBUG] Callback error:", error);
		return redirect("/login");
	}
}
