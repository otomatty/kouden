import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/app/_actions/invitations";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = await cookies();
	const invitationToken = cookieStore.get("invitation_token")?.value;
	// URLパラメータからもトークンを取得（フォールバック）
	const urlInvitationToken = requestUrl.searchParams.get("token");
	// Read custom redirect target (deprecated, cookie override used)
	const redirectToParam = requestUrl.searchParams.get("redirectTo");

	// Use cookie token first, fallback to URL parameter
	const finalInvitationToken = invitationToken || urlInvitationToken;

	try {
		const supabase = await createClient();

		if (code) {
			const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
			if (authError) {
				console.error("[ERROR] Auth error during exchange:", authError);
				return Response.redirect(
					new URL(
						`/auth/login?error=${encodeURIComponent("認証に失敗しました")}`,
						requestUrl.origin,
					),
				);
			}
		}

		// Check for post-auth redirect cookie
		const postRedirect = cookieStore.get("post_auth_redirect")?.value;
		if (postRedirect) {
			cookieStore.delete("post_auth_redirect");
			return Response.redirect(new URL(postRedirect, requestUrl.origin));
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			console.error("[ERROR] No user found after authentication");
			return Response.redirect(
				new URL(
					`/auth/login?error=${encodeURIComponent("ユーザー情報を取得できませんでした")}`,
					requestUrl.origin,
				),
			);
		}

		// Handle invitation acceptance if token is present
		if (finalInvitationToken) {
			try {
				console.log("[DEBUG] Processing invitation with token:", finalInvitationToken);
				await acceptInvitation(finalInvitationToken);

				// Clean up cookies after successful invitation acceptance
				cookieStore.delete("invitation_token");

				console.log("[SUCCESS] Invitation accepted successfully");

				// Redirect to koudens page with success message
				return Response.redirect(new URL("/koudens?invitation=accepted", requestUrl.origin));
			} catch (error) {
				console.error("[ERROR] Error accepting invitation:", error);

				// Clean up invitation token cookie even on error
				cookieStore.delete("invitation_token");

				const errorMessage =
					error instanceof Error ? error.message : "招待の受け入れに失敗しました";

				// Handle specific invitation errors
				if (error instanceof Error) {
					switch (error.message) {
						case "招待が見つかりません":
						case "招待の有効期限が切れています":
						case "この招待は既に使用されています":
						case "招待の使用回数が上限に達しました":
							return Response.redirect(
								new URL(
									`/invitation-error?error=${encodeURIComponent(error.message)}&type=invalid`,
									requestUrl.origin,
								),
							);
						case "すでにメンバーとして参加しています":
							return Response.redirect(new URL("/koudens?invitation=existing", requestUrl.origin));
						default:
							return Response.redirect(
								new URL(
									`/invitation-error?error=${encodeURIComponent(errorMessage)}&type=server`,
									requestUrl.origin,
								),
							);
					}
				}

				return Response.redirect(
					new URL(
						`/invitation-error?error=${encodeURIComponent(errorMessage)}&type=unknown`,
						requestUrl.origin,
					),
				);
			}
		}

		// If a custom redirect was requested, go there first
		if (redirectToParam) {
			return Response.redirect(new URL(redirectToParam, requestUrl.origin));
		}

		// Determine application access based on organization membership
		try {
			const { data: memberships } = await supabase
				.schema("common")
				.from("organization_members")
				.select("organization_id")
				.eq("user_id", user.id);

			if ((memberships?.length ?? 0) > 0) {
				return Response.redirect(new URL("/application-select", requestUrl.origin));
			}
		} catch (error) {
			console.error("[ERROR] Failed to check organization membership:", error);
			// Continue to default redirect even if organization check fails
		}

		// default to main app
		return Response.redirect(new URL("/koudens", requestUrl.origin));
	} catch (error) {
		console.error("[ERROR] Unexpected error in auth callback:", error);
		const errorMessage =
			error instanceof Error ? error.message : "認証処理中にエラーが発生しました";
		return Response.redirect(
			new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin),
		);
	}
}
