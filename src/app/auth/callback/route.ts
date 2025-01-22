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
			const { error: authError } =
				await supabase.auth.exchangeCodeForSession(code);
			if (authError) {
				console.error("[DEBUG] Auth error during exchange:", authError);
				return redirect("/login");
			}
		}

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.user) {
			return redirect("/login");
		}

		if (invitationToken) {
			try {
				await acceptInvitation(invitationToken);
				cookieStore.delete("invitation_token");
			} catch (error) {
				console.error("[DEBUG] Error accepting invitation:", error);
				const errorMessage =
					error instanceof Error ? error.message : "不明なエラー";
				return redirect(
					`/invitation-error?error=${encodeURIComponent(errorMessage)}`,
				);
			}
		}

		return redirect("/koudens");
	} catch (error) {
		return redirect("/login");
	}
}
