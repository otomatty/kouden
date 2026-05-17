import { acceptInvitation } from "@/app/_actions/invitations";
import { sanitizeRedirectPath } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = await cookies();
	const invitationToken = cookieStore.get("invitation_token")?.value;
	// URLパラメータからもトークンを取得（フォールバック）
	const urlInvitationToken = requestUrl.searchParams.get("token");
	// 認証後リダイレクト先（オープンリダイレクト対策で相対パスのみ許可）
	const redirectToParam = sanitizeRedirectPath(requestUrl.searchParams.get("redirectTo"));

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
		// Cookie値は document.cookie 経由で書き込まれるため、相対パスに正規化してから使う
		const rawPostRedirect = cookieStore.get("post_auth_redirect")?.value;
		const postRedirect = sanitizeRedirectPath(rawPostRedirect);
		if (rawPostRedirect) {
			cookieStore.delete("post_auth_redirect");
		}
		if (postRedirect) {
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
				// `acceptInvitation` は ActionResult を返すため、`ok: false` を
				// 成功と取り違えないよう分岐する。失敗時もトークン Cookie を掃除する。
				const result = await acceptInvitation(finalInvitationToken);
				if (!result.ok) {
					cookieStore.delete("invitation_token");
					const { code, message } = result.error;
					if (code === "ALREADY_EXISTS") {
						return Response.redirect(
							new URL("/koudens?invitation=existing", requestUrl.origin),
						);
					}
					const errorType =
						code === "NOT_FOUND" || code === "INVALID_OPERATION" ? "invalid" : "server";
					return Response.redirect(
						new URL(
							`/invitation-error?error=${encodeURIComponent(message)}&type=${errorType}`,
							requestUrl.origin,
						),
					);
				}

				// Clean up cookies after successful invitation acceptance
				cookieStore.delete("invitation_token");

				// Redirect to koudens page with success message
				return Response.redirect(new URL("/koudens?invitation=accepted", requestUrl.origin));
			} catch (error) {
				console.error("[ERROR] Error accepting invitation:", error);

				// Clean up invitation token cookie even on error
				cookieStore.delete("invitation_token");

				const errorMessage =
					error instanceof Error ? error.message : "招待の受け入れに失敗しました";

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
