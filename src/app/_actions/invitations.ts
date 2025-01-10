"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/gmail";
import type {
	GetKoudenInvitationsParams,
	AcceptInvitationParams,
	KoudenInvitation,
} from "@/types/sharing";

interface CreateInvitationParams {
	koudenId: string;
	email: string;
	role: "viewer" | "editor";
	userId: string;
}

export async function createInvitation({
	koudenId,
	email,
	role,
	userId,
}: CreateInvitationParams): Promise<{ error?: string }> {
	try {
		const supabase = await createClient();

		// 香典帳の情報を取得
		const { data: kouden } = await supabase
			.from("koudens")
			.select(`
				title,
				owner:profiles!owner_id(
					display_name
				)
			`)
			.eq("id", koudenId)
			.single();

		if (!kouden) {
			return { error: "香典帳が見つかりません" };
		}

		// 既存の招待をチェック
		const { data: existingInvitation } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("kouden_id", koudenId)
			.eq("email", email)
			.is("accepted_at", null)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (existingInvitation) {
			return { error: "既に招待済みです" };
		}

		// 既にメンバーかチェック
		const { data: existingMember } = await supabase
			.from("kouden_members")
			.select("*")
			.eq("kouden_id", koudenId)
			.eq("user:profiles(email)", email)
			.single();

		if (existingMember) {
			return { error: "既にメンバーです" };
		}

		// 招待を作成
		const invitationToken = nanoid();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7日後に有効期限切れ

		const { error } = await supabase.from("kouden_invitations").insert({
			kouden_id: koudenId,
			email,
			role,
			invitation_token: invitationToken,
			expires_at: expiresAt.toISOString(),
			created_by: userId,
		});

		if (error) {
			throw error;
		}

		// 招待メールを送信
		const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitationToken}`;
		const roleText = role === "editor" ? "編集者" : "閲覧者";
		const subject = `【香典帳】${kouden.title}への招待`;
		const text = `
${kouden.owner?.display_name}さんから香典帳「${kouden.title}」への招待が届いています。

あなたは${roleText}として招待されました。
以下のリンクをクリックして招待を承認してください：

${inviteUrl}

※このリンクの有効期限は7日間です。
`;
		const html = `
<!DOCTYPE html>
<html>
<body>
	<p>${kouden.owner?.display_name}さんから香典帳「${kouden.title}」への招待が届いています。</p>
	<p>あなたは${roleText}として招待されました。</p>
	<p>以下のリンクをクリックして招待を承認してください：</p>
	<p><a href="${inviteUrl}">${inviteUrl}</a></p>
	<p>※このリンクの有効期限は7日間です。</p>
</body>
</html>
`;

		const { success, error: emailError } = await sendEmail({
			to: email,
			subject,
			text,
			html,
		});

		if (!success) {
			console.error("Failed to send invitation email:", emailError);
			// メール送信に失敗しても招待自体は作成されているので、エラーは返さない
		}

		return {};
	} catch (error) {
		console.error("Error creating invitation:", error);
		return { error: "招待の作成に失敗しました" };
	}
}

export async function getKoudenInvitations({
	koudenId,
}: GetKoudenInvitationsParams): Promise<{
	invitations?: KoudenInvitation[];
	error?: string;
}> {
	try {
		const supabase = await createClient();

		const { data: invitations, error } = await supabase
			.from("kouden_invitations")
			.select(`
        *,
        kouden:koudens(
          title,
          owner_id,
          owner:profiles(
            display_name
          )
        )
      `)
			.eq("kouden_id", koudenId)
			.is("accepted_at", null)
			.gt("expires_at", new Date().toISOString())
			.order("created_at", { ascending: true });

		if (error) {
			throw error;
		}

		return {
			invitations: invitations?.map((invitation) => ({
				...invitation,
				kouden: invitation.kouden
					? {
							...invitation.kouden,
							owner: invitation.kouden.owner,
						}
					: undefined,
			})) as KoudenInvitation[],
		};
	} catch (error) {
		console.error("Error getting kouden invitations:", error);
		return { error: "招待情報の取得に失敗しました" };
	}
}

export async function acceptInvitation({
	invitationToken,
}: AcceptInvitationParams): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// 招待情報を取得
		const { data: invitation } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", invitationToken)
			.is("accepted_at", null)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (!invitation) {
			return { success: false, error: "無効な招待です" };
		}

		// ユーザー情報を取得
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 既にメンバーかチェック
		const { data: existingMember } = await supabase
			.from("kouden_members")
			.select("*")
			.eq("kouden_id", invitation.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (existingMember) {
			return { success: false, error: "既にメンバーです" };
		}

		// メンバーとして追加
		const { error: memberError } = await supabase
			.from("kouden_members")
			.insert({
				kouden_id: invitation.kouden_id,
				user_id: user.id,
				role: invitation.role,
				created_by: invitation.created_by,
			});

		if (memberError) {
			throw memberError;
		}

		// 招待を承認済みに更新
		const { error: updateError } = await supabase
			.from("kouden_invitations")
			.update({ accepted_at: new Date().toISOString() })
			.eq("id", invitation.id);

		if (updateError) {
			throw updateError;
		}

		return { success: true };
	} catch (error) {
		console.error("Error accepting invitation:", error);
		return { success: false, error: "招待の承認に失敗しました" };
	}
}

export async function cancelInvitation(
	invitationId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// 招待情報を取得
		const { data: invitation } = await supabase
			.from("kouden_invitations")
			.select("kouden_id")
			.eq("id", invitationId)
			.single();

		if (!invitation) {
			return { success: false, error: "招待が見つかりません" };
		}

		// 現在のユーザーが香典帳のオーナーかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", invitation.kouden_id)
			.single();

		if (!kouden) {
			return { success: false, error: "香典帳が見つかりません" };
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || user.id !== kouden.owner_id) {
			return { success: false, error: "権限がありません" };
		}

		// 招待を削除
		const { error } = await supabase
			.from("kouden_invitations")
			.delete()
			.eq("id", invitationId);

		if (error) {
			throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("Error canceling invitation:", error);
		return { success: false, error: "招待のキャンセルに失敗しました" };
	}
}
