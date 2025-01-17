"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
	CreateKoudenParams,
	GetKoudensParams,
	Kouden,
	KoudenEntry,
} from "@/types/kouden";
import { initializeDefaultRelationships } from "./relationships";

const koudenSchema = z.object({
	title: z.string().min(1, "香典帳のタイトルを入力してください"),
	description: z.string().optional(),
});

export type CreateKoudenInput = z.infer<typeof koudenSchema>;

export async function createKouden({
	title,
	description,
	userId,
}: CreateKoudenParams): Promise<{ kouden?: Kouden; error?: string }> {
	try {
		const supabase = await createClient();

		// ユーザーIDが渡されていない場合は現在のユーザーのIDを使用
		if (!userId) {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				return { error: "認証が必要です" };
			}
			userId = user.id;
		}

		// トランザクションを開始
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.insert({
				title,
				description,
				owner_id: userId,
				created_by: userId,
			})
			.select(
				`
        *,
        owner:profiles!koudens_owner_id_fkey(
          display_name
        )
      `,
			)
			.single();

		if (koudenError) {
			throw koudenError;
		}

		// kouden_membersテーブルに作成者を登録
		const { data: ownerRole, error: roleError } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", kouden.id)
			.eq("name", "編集者")
			.single();

		if (!ownerRole || roleError) {
			throw new Error("編集者ロールの取得に失敗しました");
		}

		const { error: memberError } = await supabase
			.from("kouden_members")
			.insert({
				kouden_id: kouden.id,
				user_id: userId,
				role_id: ownerRole.id,
				added_by: userId,
			});

		if (memberError) {
			throw memberError;
		}

		// デフォルトの関係性を初期化
		await initializeDefaultRelationships(kouden.id);

		return {
			kouden: {
				...kouden,
				owner: kouden.owner,
			} as unknown as Kouden,
		};
	} catch (error) {
		console.error("[ERROR] Error creating kouden:", error);
		return { error: "香典帳の作成に失敗しました" };
	}
}

export async function getKoudens({
	userId,
}: GetKoudensParams): Promise<{ koudens?: Kouden[]; error?: string }> {
	try {
		const supabase = await createClient();

		// まず所有している香典帳を取得
		const { data: ownedKoudens, error: ownedError } = await supabase
			.from("koudens")
			.select(`
				*,
				owner:profiles!koudens_owner_id_fkey(
					display_name
				)
			`)
			.eq("owner_id", userId)
			.order("created_at", { ascending: false });

		if (ownedError) {
			console.error("[ERROR] Error fetching owned koudens:", ownedError);
			throw ownedError;
		}

		// 次にメンバーとして参加している香典帳を取得
		const { data: memberKoudens, error: memberError } = await supabase
			.from("kouden_members")
			.select(`
				koudens (
					*,
					owner:profiles!koudens_owner_id_fkey(
						display_name
					)
				)
			`)
			.eq("user_id", userId);

		if (memberError) {
			console.error("[ERROR] Error fetching member koudens:", memberError);
			throw memberError;
		}

		// 重複を排除して結果を結合
		const koudenMap = new Map();

		// 所有している香典帳を追加
		for (const kouden of ownedKoudens) {
			koudenMap.set(kouden.id, kouden);
		}

		// メンバーとして参加している香典帳を追加（既に存在する場合は上書きしない）
		for (const member of memberKoudens) {
			const kouden = member.koudens;
			if (!koudenMap.has(kouden.id)) {
				koudenMap.set(kouden.id, kouden);
			}
		}

		// Map から配列に変換し、作成日時でソート
		const koudens = Array.from(koudenMap.values()).sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		);

		return {
			koudens: koudens as unknown as Kouden[],
		};
	} catch (error) {
		console.error("[ERROR] Error getting koudens:", error);
		return { error: "香典帳の取得に失敗しました" };
	}
}

export async function getKouden(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("koudens")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		throw new Error("香典帳の取得に失敗しました");
	}

	return data;
}

export async function getKoudenWithEntries(id: string) {
	const supabase = await createClient();

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error("認証が必要です");
	}

	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select(`
			*,
			owner:profiles!koudens_owner_id_fkey(
				display_name
			)
			`)
		.eq("id", id)
		.single();

	if (koudenError) {
		console.error("[ERROR] Error fetching kouden:", koudenError);
		throw new Error("香典帳の取得に失敗しました");
	}

	if (!kouden) {
		throw new Error("指定された香典帳が見つかりません");
	}

	const { data: entries, error: entriesError } = await supabase
		.from("kouden_entries")
		.select(`
			*,
			offerings (*),
			return_items (*)
		`)
		.eq("kouden_id", id)
		.order("created_at", { ascending: false });

	if (entriesError) {
		console.error("[ERROR] Error fetching kouden entries:", entriesError);
		throw new Error("香典帳の記帳データの取得に失敗しました");
	}

	return {
		kouden,
		entries: entries as unknown as KoudenEntry[],
	};
}

export async function updateKouden(
	id: string,
	input: { title: string; description?: string },
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("koudens").update(input).eq("id", id);

	if (error) {
		throw new Error("香典帳の更新に失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
}

export async function deleteKouden(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { error } = await supabase.from("koudens").delete().eq("id", id);

	if (error) {
		throw new Error("香典帳の削除に失敗しました");
	}

	revalidatePath("/koudens");
	redirect("/koudens");
}

export async function shareKouden(id: string, userIds: string[]) {
	const supabase = await createClient();
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
		.eq("name", "閲覧者")
		.single();

	if (!viewerRole) {
		throw new Error("閲覧者ロールの取得に失敗しました");
	}

	await supabase
		.from("kouden_members")
		.delete()
		.eq("kouden_id", id)
		.neq("user_id", user.id);

	const { error } = await supabase.from("kouden_members").insert(
		userIds.map((userId) => ({
			kouden_id: id,
			user_id: userId,
			role_id: viewerRole.id,
			added_by: user.id,
		})),
	);

	if (error) {
		throw new Error("香典帳の共有に失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
}

export async function archiveKouden(id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	const { data, error } = await supabase
		.from("koudens")
		.update({
			status: "archived",
		})
		.eq("id", id)
		.select()
		.single();

	if (error) {
		throw new Error("香典帳のアーカイブに失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
	return data;
}
