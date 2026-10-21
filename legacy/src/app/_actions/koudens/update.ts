"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Kouden } from "@/types/kouden";
import { KOUDEN_ROLES } from "@/types/role";
import { revalidatePath } from "next/cache";
import { requireKoudenEditor, requireKoudenOwner } from "../permissions";

/**
 * 香典帳の更新
 */
export async function updateKouden(
	id: string,
	input: { title: string; description?: string },
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		// 入力バリデーション
		if (!input.title?.trim()) {
			throw new KoudenError("タイトルを入力してください", ErrorCodes.VALIDATION_ERROR);
		}

		if (input.title.length > 100) {
			throw new KoudenError("タイトルは100文字以内で入力してください", ErrorCodes.VALIDATION_ERROR);
		}

		if (input.description && input.description.length > 500) {
			throw new KoudenError("説明は500文字以内で入力してください", ErrorCodes.VALIDATION_ERROR);
		}

		await requireKoudenEditor(id, "この香典帳を編集する権限がありません");

		const supabase = await createClient();

		// データの整形
		const updateData = {
			title: input.title.trim(),
			description: input.description?.trim() || null,
		};

		const { error } = await supabase.from("koudens").update(updateData).eq("id", id);

		if (error) throw error;

		revalidatePath(`/koudens/${id}`);
		return null;
	}, "香典帳の更新");
}

/**
 * 香典帳の共有
 */
export async function shareKouden(id: string, userIds: string[]): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		await requireKoudenOwner(id, "共有権限がありません");

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 閲覧者ロールを取得
		const { data: viewerRole } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", id)
			.eq("name", KOUDEN_ROLES.VIEWER)
			.single();

		if (!viewerRole) {
			throw new KoudenError("閲覧者ロールの取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
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

		if (shareError) throw shareError;

		revalidatePath(`/koudens/${id}`);
		return null;
	}, "香典帳の共有");
}

/**
 * 香典帳のアーカイブ
 */
export async function archiveKouden(id: string): Promise<ActionResult<Kouden>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		await requireKoudenOwner(id, "アーカイブ権限がありません");

		const { data, error } = await supabase
			.from("koudens")
			.update({ status: "archived" })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		revalidatePath(`/koudens/${id}`);
		return data;
	}, "香典帳のアーカイブ");
}
