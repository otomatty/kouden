"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import ms from "ms";
import type { Database } from "@/types/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

const createInvitationSchema = z.object({
	koudenId: z.string().uuid(),
	roleId: z.string().uuid(),
	maxUses: z.number().nullable().optional(),
	expiresIn: z.string().default("7d"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

// kouden_invitations テーブルの行型に kouden_data の具体的な型をマージする
// JSONB カラムの型は Supabase 生成型だと Json とかになるから、ここで上書きするの
type KoudenInvitationRowWithKoudenData =
	Database["public"]["Tables"]["kouden_invitations"]["Row"] & {
		kouden_data: { id: string; title: string; description?: string } | null;
	};

export async function createShareInvitation(
	input: CreateInvitationInput,
): Promise<KoudenInvitationRowWithKoudenData> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		const { koudenId, roleId, maxUses, expiresIn } = createInvitationSchema.parse(input);

		// 香典帳の情報を取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("id, title, description")
			.eq("id", koudenId)
			.single();

		if (koudenError) {
			throw new Error("香典帳情報の取得に失敗しました");
		}

		// 招待情報を作成
		const { data: invitation, error } = await supabase
			.from("kouden_invitations")
			.insert({
				kouden_id: koudenId,
				role_id: roleId,
				max_uses: maxUses,
				expires_at: new Date(Date.now() + (ms(expiresIn) as number)).toISOString(),
				created_by: user.id,
				kouden_data: kouden,
			})
			.select()
			.single<KoudenInvitationRowWithKoudenData>();

		if (error) {
			throw new Error("招待リンクの作成に失敗しました");
		}

		return invitation;
	} catch (error) {
		console.error("[ERROR] Error in createShareInvitation:", error);
		throw error;
	}
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

		// NOTE: getInvitation の返り値も型を厳密にするなら修正が必要
		const { data: invitation, error: invitationError } = (await query) as {
			data: KoudenInvitationRowWithKoudenData | null;
			error: PostgrestError;
		};

		if (invitationError) {
			console.error("[ERROR] Database error in getInvitation:", invitationError);
			if (invitationError.code === "PGRST116") {
				throw new Error("招待情報が見つかりません");
			}
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!invitation) {
			console.error("[ERROR] No invitation found for token:", token);
			throw new Error("招待情報が見つかりません");
		}

		// 作成者の情報を取得
		const { data: creatorProfile, error: creatorError } = await supabase
			.from("profiles")
			.select("display_name")
			.eq("id", invitation.created_by)
			.single();

		if (creatorError) {
			console.warn("[WARN] Failed to get creator profile:", creatorError);
		}

		// ユーザーが既にメンバーかどうかをチェック
		let isExistingMember = false;
		if (user) {
			const { data: existingMember, error: memberCheckError } = await supabase
				.from("kouden_members")
				.select()
				.eq("kouden_id", invitation.kouden_id)
				.eq("user_id", user.id)
				.single();

			if (memberCheckError && memberCheckError.code !== "PGRST116") {
				console.warn("[WARN] Failed to check existing membership:", memberCheckError);
			}

			isExistingMember = !!existingMember;
		}

		// 全ての情報を結合して返す
		const result = {
			...invitation,
			creator: creatorProfile || null,
			kouden_data: invitation.kouden_data,
			isExistingMember,
		};

		return result;
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
			throw new Error("認証が必要です");
		}

		// 1. 招待情報を取得
		const { data: invitation, error: invitationError } = await supabase
			.from("kouden_invitations")
			.select("*")
			.eq("invitation_token", token)
			.single();

		if (invitationError) {
			console.error("[ERROR] Failed to get invitation:", invitationError);
			if (invitationError.code === "PGRST116") {
				throw new Error("招待が見つかりません");
			}
			throw new Error("招待情報の取得に失敗しました");
		}

		if (!invitation) {
			console.error("[ERROR] No invitation found for token:", token);
			throw new Error("招待が見つかりません");
		}

		// 2. 招待の有効性チェック
		if (invitation.status !== "pending") {
			console.error("[ERROR] Invitation status is not pending:", invitation.status);
			throw new Error("この招待は既に使用されています");
		}

		const now = new Date();
		const expiresAt = new Date(invitation.expires_at);
		if (expiresAt < now) {
			console.error("[ERROR] Invitation expired:", { expiresAt, now });
			throw new Error("招待の有効期限が切れています");
		}

		if (invitation.max_uses && invitation.used_count >= invitation.max_uses) {
			console.error("[ERROR] Invitation usage limit exceeded:", {
				used_count: invitation.used_count,
				max_uses: invitation.max_uses,
			});
			throw new Error("招待の使用回数が上限に達しました");
		}

		// 3. 既存メンバーチェック
		const { data: existingMember, error: memberCheckError } = await supabase
			.from("kouden_members")
			.select()
			.eq("kouden_id", invitation.kouden_id)
			.eq("user_id", user.id)
			.single();

		if (memberCheckError && memberCheckError.code !== "PGRST116") {
			console.error("[ERROR] Failed to check existing membership:", memberCheckError);
			throw new Error("メンバーシップの確認に失敗しました");
		}

		if (existingMember) {
			console.error("[ERROR] User is already a member:", {
				user_id: user.id,
				kouden_id: invitation.kouden_id,
			});
			throw new Error("すでにメンバーとして参加しています");
		}

		// 4. メンバー追加
		const { error: memberError } = await supabase.from("kouden_members").insert({
			kouden_id: invitation.kouden_id,
			user_id: user.id,
			role_id: invitation.role_id,
			invitation_id: invitation.id,
			added_by: user.id,
		});

		if (memberError) {
			console.error("[ERROR] Failed to add member:", memberError);
			throw new Error("メンバーの追加に失敗しました");
		}

		// 5. 招待のステータスと使用回数を更新
		const { error: updateError } = await supabase
			.from("kouden_invitations")
			.update({
				status: "accepted",
				used_count: invitation.used_count + 1,
			})
			.eq("id", invitation.id);

		if (updateError) {
			console.error("[ERROR] Failed to update invitation:", updateError);
			// メンバー追加は成功しているので、招待の更新失敗は警告レベル
			console.warn("[WARN] Member was added but invitation update failed");
		} else {
		}

		return { success: true };
	} catch (error) {
		console.error("[ERROR] Error in acceptInvitation:", error);
		throw error;
	}
}
