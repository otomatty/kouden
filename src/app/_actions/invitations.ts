"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import ms from "ms";
import { InvitationError } from "@/types/error";
import { cookies } from "next/headers";

const createInvitationSchema = z.object({
	koudenId: z.string().uuid(),
	roleId: z.string().uuid(),
	maxUses: z.number().nullable().optional(),
	expiresIn: z.string().default("7d"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export async function createShareInvitation(input: CreateInvitationInput) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		const { koudenId, roleId, maxUses, expiresIn } =
			createInvitationSchema.parse(input);

		const { data: invitation, error } = await supabase
			.from("kouden_invitations")
			.insert({
				kouden_id: koudenId,
				role_id: roleId,
				invitation_type: "share",
				max_uses: maxUses,
				expires_at: new Date(
					Date.now() + (ms(expiresIn) as number),
				).toISOString(),
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			console.error("[ERROR] Error creating invitation:", error);
			throw new Error("招待リンクの作成に失敗しました");
		}

		revalidatePath(`/koudens/${koudenId}`);
		return invitation;
	} catch (error) {
		console.error("[ERROR] Error in createShareInvitation:", error);
		throw error;
	}
}

export async function getInvitation(token: string) {
	try {
		const supabase = await createClient();

		// まず招待情報の基本データを取得
		const { data: basicInvitation, error: basicError } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", token)
			.eq("status", "pending")
			.gt("expires_at", new Date().toISOString())
			.single();

		if (basicError) {
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!basicInvitation) {
			console.error("[ERROR] No invitation found for token:", token);
			throw new Error("招待情報が見つかりません");
		}

		// 関連データを個別に取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("id, title, description")
			.eq("id", basicInvitation.kouden_id)
			.single();

		if (koudenError) {
			console.error("[ERROR] Error fetching kouden:", koudenError);
			throw new Error("香典帳情報の取得に失敗しました");
		}

		const { data: role, error: roleError } = await supabase
			.from("kouden_roles")
			.select("id, name")
			.eq("id", basicInvitation.role_id)
			.single();

		if (roleError) {
			console.error("[ERROR] Error fetching role:", roleError);
			throw new Error("ロール情報の取得に失敗しました");
		}

		const { data: creator, error: creatorError } = await supabase
			.from("profiles")
			.select("display_name")
			.eq("id", basicInvitation.created_by)
			.single();

		if (creatorError) {
			console.error("[ERROR] Error fetching creator profile:", creatorError);
			throw new Error("作成者情報の取得に失敗しました");
		}

		// 全てのデータを結合
		const invitation = {
			...basicInvitation,
			kouden,
			role,
			created_by_profile: creator,
		};

		return invitation;
	} catch (error) {
		console.error("[ERROR] Error in getInvitation:", error);
		throw error;
	}
}

export async function acceptInvitation(token: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new InvitationError(
				"UNAUTHORIZED",
				"招待を受け入れるにはログインが必要です",
			);
		}

		// 1. 招待の有効性チェック
		const { data: invitation, error: invitationError } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", token)
			.single();

		if (invitationError || !invitation) {
			throw new InvitationError("INVITATION_NOT_FOUND", "招待が見つかりません");
		}

		// ステータスチェック
		if (invitation.status !== "pending") {
			throw new InvitationError(
				"INVITATION_USED",
				"この招待は既に使用されています",
			);
		}

		// 有効期限チェック
		if (new Date(invitation.expires_at) < new Date()) {
			throw new InvitationError(
				"INVITATION_EXPIRED",
				"招待の有効期限が切れています",
			);
		}

		// 2. 使用回数チェック
		if (invitation.max_uses && invitation.used_count >= invitation.max_uses) {
			throw new InvitationError(
				"MAX_USES_EXCEEDED",
				"招待の使用回数が上限に達しました",
			);
		}

		// 3. 既存メンバーチェック
		const { data: existingMember } = await supabase
			.from("kouden_members")
			.select()
			.eq("kouden_id", invitation.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (existingMember) {
			throw new InvitationError(
				"ALREADY_MEMBER",
				"すでにメンバーとして参加しています",
			);
		}

		// 4. メンバー追加
		const { error: memberError } = await supabase
			.from("kouden_members")
			.insert({
				kouden_id: invitation.kouden_id,
				user_id: user.id,
				role_id: invitation.role_id,
				invitation_id: invitation.id,
				added_by: invitation.created_by,
			});

		if (memberError) {
			console.error("[ERROR] Error adding member:", memberError);
			throw new InvitationError(
				"INTERNAL_ERROR",
				"メンバーの追加に失敗しました",
			);
		}

		// 5. 招待のステータスを更新
		const { error: updateError } = await supabase
			.from("kouden_invitations")
			.update({
				status: "accepted",
				used_count: invitation.used_count + 1,
			})
			.eq("id", invitation.id);

		if (updateError) {
			console.error("[ERROR] Error updating invitation:", updateError);
			throw new InvitationError("INTERNAL_ERROR", "招待の更新に失敗しました");
		}

		revalidatePath(`/koudens/${invitation.kouden_id}`);
		return { success: true };
	} catch (error) {
		console.error("[ERROR] Error in acceptInvitation:", error);
		if (error instanceof InvitationError) {
			throw error;
		}
		throw new InvitationError("INTERNAL_ERROR", "予期せぬエラーが発生しました");
	}
}

export async function deleteInvitationToken() {
	const cookieStore = await cookies();
	cookieStore.delete("invitation_token");
}
