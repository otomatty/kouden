"use server";

import { createClient } from "@/lib/supabase/server";
import type {
	GetKoudenMembersParams,
	UpdateMemberRoleParams,
	KoudenMember,
} from "@/types/sharing";

export async function getKoudenMembers({
	koudenId,
}: GetKoudenMembersParams): Promise<{
	members?: KoudenMember[];
	error?: string;
}> {
	try {
		const supabase = await createClient();

		const { data: members, error } = await supabase
			.from("kouden_members")
			.select(`
        *,
        user:profiles(
          display_name,
          avatar_url
        )
      `)
			.eq("kouden_id", koudenId)
			.order("created_at", { ascending: true });

		if (error) {
			throw error;
		}

		return { members: members as KoudenMember[] };
	} catch (error) {
		console.error("Error getting kouden members:", error);
		return { error: "メンバー情報の取得に失敗しました" };
	}
}

export async function updateMemberRole({
	memberId,
	role,
}: UpdateMemberRoleParams): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// メンバーの情報を取得
		const { data: member } = await supabase
			.from("kouden_members")
			.select("kouden_id")
			.eq("id", memberId)
			.single();

		if (!member) {
			return { success: false, error: "メンバーが見つかりません" };
		}

		// 現在のユーザーが香典帳のオーナーかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", member.kouden_id)
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

		// メンバーの権限を更新
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
		return { success: false, error: "メンバーの権限更新に失敗しました" };
	}
}

export async function removeMember(
	memberId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// メンバーの情報を取得
		const { data: member } = await supabase
			.from("kouden_members")
			.select("kouden_id")
			.eq("id", memberId)
			.single();

		if (!member) {
			return { success: false, error: "メンバーが見つかりません" };
		}

		// 現在のユーザーが香典帳のオーナーかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", member.kouden_id)
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

		// メンバーを削除
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
		return { success: false, error: "メンバーの削除に失敗しました" };
	}
}
