import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = await cookies();
	const invitationToken =
		requestUrl.searchParams.get("invitation_token") ??
		cookieStore.get("invitation_token")?.value;

	const queryToken = requestUrl.searchParams.get("invitation_token");
	if (queryToken) {
		cookieStore.set("invitation_token", queryToken);
	}

	try {
		const supabase = await createClient();

		if (code) {
			const { error: authError } =
				await supabase.auth.exchangeCodeForSession(code);
			if (authError) {
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
			const { data: invitation, error: invitationError } = await supabase
				.from("kouden_invitations")
				.select("*")
				.eq("invitation_token", invitationToken)
				.single();

			if (invitationError || !invitation) {
				return redirect("/invitation-error?error=invalid_invitation");
			}

			const { data: existingMember } = await supabase
				.from("kouden_members")
				.select("*")
				.eq("kouden_id", invitation.kouden_id)
				.eq("user_id", session.user.id)
				.single();

			if (existingMember) {
				await supabase
					.from("kouden_invitations")
					.update({ status: "accepted" })
					.eq("id", invitation.id);
			} else {
				const { error: insertError } = await supabase
					.from("kouden_members")
					.insert({
						kouden_id: invitation.kouden_id,
						user_id: session.user.id,
						role_id: invitation.role_id,
						added_by: invitation.created_by,
					});

				if (insertError) {
					return redirect("/invitation-error?error=member_creation_failed");
				}

				await supabase
					.from("kouden_invitations")
					.update({ status: "accepted" })
					.eq("id", invitation.id);
			}

			cookieStore.delete("invitation_token");
			return redirect("/koudens");
		}

		return redirect("/koudens");
	} catch (error) {
		return redirect("/koudens");
	}
}
