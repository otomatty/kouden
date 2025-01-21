"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import ms from "ms";

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

		// 香典帳の情報を取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("id, title, description")
			.eq("id", koudenId)
			.single();

		if (koudenError) {
			console.error("[ERROR] Error fetching kouden:", koudenError);
			throw new Error("香典帳情報の取得に失敗しました");
		}

		// 招待情報を作成
		const { data: invitation, error } = await supabase
			.from("kouden_invitations")
			.insert({
				kouden_id: koudenId,
				role_id: roleId,
				max_uses: maxUses,
				expires_at: new Date(
					Date.now() + (ms(expiresIn) as number),
				).toISOString(),
				created_by: user.id,
				kouden_data: kouden,
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

interface KoudenData {
	id: string;
	title: string;
	description?: string;
}

export async function getInvitation(token: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		// 招待情報を取得
		const query = supabase
			.from("kouden_invitations")
			.select(`
				*,
				role:kouden_roles!kouden_invitations_role_id_fkey (
					id,
					name
				)
			`)
			.eq("invitation_token", token)
			.eq("status", "pending")
			.gt("expires_at", new Date().toISOString())
			.single();

		const { data: invitation, error: invitationError } = await query;

		if (invitationError) {
			console.error("[DEBUG] Error details:", {
				code: invitationError.code,
				message: invitationError.message,
				details: invitationError.details,
				hint: invitationError.hint,
			});
			console.error("[ERROR] Error fetching invitation:", invitationError);
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!invitation) {
			console.error("[ERROR] No invitation found for token:", token);
			throw new Error("招待情報が見つかりません");
		}

		// kouden_dataの型を保証
		const kouden_data = invitation.kouden_data as KoudenData | null;

		// 作成者の情報を取得
		const { data: creatorProfile, error: creatorError } = await supabase
			.from("profiles")
			.select("display_name")
			.eq("id", invitation.created_by)
			.single();

		// ユーザーが既にメンバーかどうかをチェック
		let isExistingMember = false;
		if (user) {
			const { data: existingMember } = await supabase
				.from("kouden_members")
				.select()
				.eq("kouden_id", invitation.kouden_id)
				.eq("user_id", user.id)
				.single();

			isExistingMember = !!existingMember;
		}

		if (creatorError) {
			console.error("[DEBUG] Creator profile error details:", {
				code: creatorError.code,
				message: creatorError.message,
				details: creatorError.details,
				hint: creatorError.hint,
			});
			console.error("[ERROR] Error fetching creator profile:", creatorError);
			// プロフィール情報の取得に失敗しても、招待情報は返す
			return {
				...invitation,
				creator: null,
				kouden_data,
				isExistingMember,
			};
		}

		// 全ての情報を結合して返す
		const result = {
			...invitation,
			creator: creatorProfile,
			kouden_data,
			isExistingMember,
		};

		return result;
	} catch (error) {
		console.error("[DEBUG] Caught error:", error);
		console.error("[ERROR] Error in getInvitation:", error);
		throw error;
	}
}

export async function acceptInvitation(token: string) {
	try {
		console.log("[DEBUG] Starting acceptInvitation with token:", token);
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		console.log("[DEBUG] Current user:", user?.id);

		if (!user) {
			console.log("[DEBUG] No authenticated user found");
			throw new Error("認証が必要です");
		}

		// 1. 招待情報を取得
		console.log("[DEBUG] Fetching invitation info");
		const { data: invitation, error: invitationError } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", token)
			.single();

		if (invitationError || !invitation) {
			console.error("[DEBUG] Error fetching invitation:", invitationError);
			throw new Error("招待が見つかりません");
		}

		console.log("[DEBUG] Found invitation:", invitation);

		// 2. 招待の有効性チェック
		if (invitation.status !== "pending") {
			console.log("[DEBUG] Invalid invitation status:", invitation.status);
			throw new Error("この招待は既に使用されています");
		}

		if (new Date(invitation.expires_at) < new Date()) {
			console.log("[DEBUG] Invitation expired at:", invitation.expires_at);
			throw new Error("招待の有効期限が切れています");
		}

		if (invitation.max_uses && invitation.used_count >= invitation.max_uses) {
			console.log("[DEBUG] Max uses exceeded:", {
				max: invitation.max_uses,
				current: invitation.used_count,
			});
			throw new Error("招待の使用回数が上限に達しました");
		}

		// 3. 既存メンバーチェック
		console.log("[DEBUG] Checking existing membership");
		const { data: existingMember } = await supabase
			.from("kouden_members")
			.select()
			.eq("kouden_id", invitation.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (existingMember) {
			console.log("[DEBUG] User is already a member");
			throw new Error("すでにメンバーとして参加しています");
		}

		// 4. メンバー追加
		console.log("[DEBUG] Adding new member");
		const { error: memberError } = await supabase
			.from("kouden_members")
			.insert({
				kouden_id: invitation.kouden_id,
				user_id: user.id,
				role_id: invitation.role_id,
				invitation_id: invitation.id,
				added_by: user.id,
			});

		if (memberError) {
			console.error("[DEBUG] Error adding member:", memberError);
			throw new Error("メンバーの追加に失敗しました");
		}

		// 5. 招待のステータスと使用回数を更新
		console.log("[DEBUG] Updating invitation status");
		const { error: updateError } = await supabase
			.from("kouden_invitations")
			.update({
				status: "accepted",
				used_count: invitation.used_count + 1,
			})
			.eq("id", invitation.id);

		if (updateError) {
			console.error("[DEBUG] Error updating invitation:", updateError);
			throw new Error("招待の更新に失敗しました");
		}

		console.log("[DEBUG] Successfully completed invitation process");
		return { success: true };
	} catch (error) {
		console.error("[DEBUG] Error in acceptInvitation:", error);
		throw error;
	}
}
