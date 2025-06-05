"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Kouden } from "@/types/kouden";
import { canEditKouden, checkKoudenPermission } from "../permissions";
import { KOUDEN_ROLES } from "@/types/role";

/**
 * 香典帳の更新
 */
export async function updateKouden(id: string, input: { title: string; description?: string }) {
	if (!(await canEditKouden(id))) {
		throw new Error("編集権限がありません");
	}

	const supabase = await createClient();
	const { error } = await supabase.from("koudens").update(input).eq("id", id);

	if (error) throw error;
	revalidatePath(`/koudens/${id}`);
}

/**
 * 香典帳の共有
 */
export async function shareKouden(id: string, userIds: string[]) {
	const supabase = await createClient();
	const role = await checkKoudenPermission(id);

	if (role !== "owner") {
		throw new Error("共有権限がありません");
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// 閲覧者ロールを取得
	const { data: viewerRole } = await supabase
		.from("kouden_roles")
		.select("id")
		.eq("kouden_id", id)
		.eq("name", KOUDEN_ROLES.VIEWER)
		.single();

	if (!viewerRole) {
		throw new Error("閲覧者ロールの取得に失敗しました");
	}

	await supabase.from("kouden_members").delete().eq("kouden_id", id).neq("user_id", user.id);

	const { error: shareError } = await supabase.from("kouden_members").insert(
		userIds.map((userId) => ({
			kouden_id: id,
			user_id: userId,
			role_id: viewerRole.id,
			added_by: user.id,
		})),
	);

	if (shareError) {
		throw new Error("香典帳の共有に失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
}

/**
 * 香典帳のアーカイブ
 */
export async function archiveKouden(id: string): Promise<Kouden> {
	const supabase = await createClient();
	const role = await checkKoudenPermission(id);

	if (role !== "owner") {
		throw new Error("アーカイブ権限がありません");
	}

	const { data, error } = await supabase
		.from("koudens")
		.update({ status: "archived" })
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("香典帳のアーカイブに失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
	return data;
}
