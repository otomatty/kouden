"use server";

import { createClient } from "@/lib/supabase/server";
import { generateKoudenInvitationEmail } from "./email-templates";
import { sendEmail } from "@/lib/gmail";
import {
	type InviteUserParams,
	type UpdateMemberRoleParams,
	type AcceptInvitationParams,
	KoudenMember,
	KoudenInvitation,
} from "@/types/sharing";

export async function inviteUserToKouden({
	koudenId,
	email,
	role,
}: InviteUserParams): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// 香典帳の情報を取得
		const { data: kouden } = await supabase
			.from("koudens")
			.select(`
				*,
				profiles!owner_id(display_name)
			`)
			.eq("id", koudenId)
			.single();

		if (!kouden) {
			return { success: false, error: "香典帳が見つかりません" };
		}

		// 既存の招待をチェック
		const { data: existingInvitation } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("kouden_id", koudenId)
			.eq("email", email)
			.is("accepted_at", null)
			.single();

		if (existingInvitation) {
			return { success: false, error: "既に招待メールが送信されています" };
		}

		// 有効期限を24時間後に設定
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 24);

		// ユーザー情報を取得
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 招待レコードを作成
		const { data: invitation, error: invitationError } = await supabase
			.from("kouden_invitations")
			.insert({
				kouden_id: koudenId,
				email,
				role,
				expires_at: expiresAt.toISOString(),
				created_by: user.id,
			})
			.select()
			.single();

		if (invitationError) {
			throw invitationError;
		}

		// 招待メールを送信
		const invitationLink = `${process.env.APP_URL}/invitations/${invitation.invitation_token}`;
		const { text, html } = generateKoudenInvitationEmail({
			koudenTitle: kouden.title,
			inviterName: kouden.profiles.display_name,
			role,
			invitationLink,
			expiresAt,
		});

		const { success, error: emailError } = await sendEmail({
			to: email,
			subject: `香典帳「${kouden.title}」への招待`,
			text,
			html,
		});

		if (!success) {
			throw new Error(emailError);
		}

		return { success: true };
	} catch (error) {
		console.error("Error inviting user:", error);
		return {
			success: false,
			error: "招待メールの送信に失敗しました",
		};
	}
}

export async function acceptKoudenInvitation({
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
		return {
			success: false,
			error: "招待の承認に失敗しました",
		};
	}
}

export async function updateMemberRole({
	memberId,
	role,
}: UpdateMemberRoleParams): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("kouden_members")
			.update({ role, updated_at: new Date().toISOString() })
			.eq("id", memberId);

		if (error) {
			throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("Error updating member role:", error);
		return {
			success: false,
			error: "メンバーの権限更新に失敗しました",
		};
	}
}

export async function removeMember(
	memberId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("kouden_members")
			.delete()
			.eq("id", memberId);

		if (error) {
			throw error;
		}

		return { success: true };
	} catch (error) {
		console.error("Error removing member:", error);
		return {
			success: false,
			error: "メンバーの削除に失敗しました",
		};
	}
}
