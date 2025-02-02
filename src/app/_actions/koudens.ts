"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CreateKoudenParams, GetKoudensParams, Kouden } from "@//types/kouden";
import type { Entry } from "@/types/entries";
import { checkKoudenPermission, hasEditPermission, isKoudenOwner } from "./permissions";
import { KOUDEN_ROLES } from "@/types/role";

const koudenSchema = z.object({
	title: z.string().min(1, "香典帳のタイトルを入力してください"),
	description: z.string().optional(),
});

export type CreateKoudenInput = z.infer<typeof koudenSchema>;

/**
 * 香典帳の作成
 * @param title 香典帳のタイトル
 * @param description 香典帳の説明
 * @param userId ユーザーID
 * @returns ユーザーが所属している(作成したorメンバーとして参加している)香典帳
 */
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

		// 1. 香典帳を作成
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.insert({
				title,
				description,
				owner_id: userId,
				created_by: userId,
			})
			.select("*")
			.single();

		if (koudenError) {
			throw koudenError;
		}

		// 2. オーナー情報を取得
		const { data: owner, error: ownerError } = await supabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", userId)
			.single();

		if (ownerError) {
			throw ownerError;
		}

		// 3. デフォルトの関係性を初期化（トリガーで自動的に作成されるため、待機する）
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// 4. 編集者ロールを取得
		const { data: ownerRole, error: roleError } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", kouden.id)
			.eq("name", KOUDEN_ROLES.EDITOR)
			.single();

		if (!ownerRole || roleError) {
			throw new Error("編集者ロールの取得に失敗しました");
		}

		// 5. メンバーとして登録
		const { error: memberError } = await supabase.from("kouden_members").insert({
			kouden_id: kouden.id,
			user_id: userId,
			role_id: ownerRole.id,
			added_by: userId,
		});

		if (memberError) {
			throw memberError;
		}

		return {
			kouden: {
				...kouden,
				owner,
			} as unknown as Kouden,
		};
	} catch (error) {
		console.error("[ERROR] Error creating kouden:", error);
		return { error: "香典帳の作成に失敗しました" };
	}
}

export async function getKoudens(): Promise<{
	koudens?: Kouden[];
	error?: string;
}> {
	try {
		const supabase = await createClient();

		// セッション情報を確認
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.user?.id) {
			return { error: "認証が必要です" };
		}

		// メンバーとして参加している香典帳のIDを取得
		const { data: memberKoudens, error: memberError } = await supabase
			.from("kouden_members")
			.select("kouden_id")
			.eq("user_id", session.user.id);

		if (memberError) {
			console.error("Member query error:", memberError);
			throw memberError;
		}

		// 香典帳を取得（オーナー/作成者 OR メンバーシップ）
		const { data: koudens, error } = await supabase
			.from("koudens")
			.select(`
				id,
				title,
				description,
				created_at,
				updated_at,
				owner_id,
				created_by,
				status
			`)
			.or(
				`owner_id.eq.${session.user.id},created_by.eq.${
					session.user.id
				},id.in.(${memberKoudens?.map((m) => m.kouden_id).join(",") || ""})`,
			)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Koudens query error:", error);
			throw error;
		}

		// オーナー情報を取得
		const ownerIds = [...new Set(koudens?.map((k) => k.owner_id) || [])];
		const { data: profiles, error: profilesError } = await supabase
			.from("profiles")
			.select("id, display_name")
			.in("id", ownerIds);

		if (profilesError) throw profilesError;

		const koudensWithProfiles = koudens?.map((kouden) => ({
			...kouden,
			owner: profiles?.find((p) => p.id === kouden.owner_id),
		}));

		return {
			koudens: koudensWithProfiles as unknown as Kouden[],
		};
	} catch (error) {
		console.error("[ERROR] Error getting koudens:", error);
		return { error: "香典帳の取得に失敗しました" };
	}
}

/**
 * 香典帳の取得
 * @param id 香典帳ID
 * @returns 香典帳
 */
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
		.select(`
			id,
			title,
			description,
			created_at,
			updated_at,
			owner_id,
			created_by,
			status
		`)
		.eq("id", id)
		.single();

	if (error) {
		throw new Error("香典帳の取得に失敗しました");
	}

	return data;
}

export async function getKoudenWithEntries(id: string) {
	const supabase = await createClient();
	const role = await checkKoudenPermission(id);

	if (!role) {
		throw new Error("アクセス権限がありません");
	}

	// 1. 香典帳の基本情報を取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select(`
			id,
			title,
			description,
			created_at,
			updated_at,
			owner_id,
			created_by,
			status
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

	// 2. オーナー情報を取得
	const { data: owner, error: ownerError } = await supabase
		.from("profiles")
		.select("id, display_name")
		.eq("id", kouden.owner_id)
		.single();

	if (ownerError) {
		console.error("[ERROR] Error fetching owner profile:", ownerError);
		throw new Error("オーナー情報の取得に失敗しました");
	}

	// 3. エントリー情報を取得
	const { data: entries, error: entriesError } = await supabase
		.from("kouden_entries")
		.select(`
			*,
			offering_entries (
				offering:offerings (
					*,
					offering_photos (*)
				)
			),
			return_items (*)
		`)
		.eq("kouden_id", id)
		.order("created_at", { ascending: false });

	if (entriesError) {
		console.error("[ERROR] Error fetching kouden entries:", entriesError);
		throw new Error("香典帳の記帳データの取得に失敗しました");
	}

	return {
		kouden: {
			...kouden,
			owner,
		},
		entries: entries as unknown as Entry[],
	};
}

export async function updateKouden(id: string, input: { title: string; description?: string }) {
	const supabase = await createClient();
	const role = await checkKoudenPermission(id);

	if (!role) {
		throw new Error("アクセス権限がありません");
	}

	if (role !== "owner" && role !== "editor") {
		throw new Error("編集権限がありません");
	}

	const { error } = await supabase.from("koudens").update(input).eq("id", id);

	if (error) {
		throw new Error("香典帳の更新に失敗しました");
	}

	revalidatePath(`/koudens/${id}`);
}

export async function deleteKouden(id: string) {
	const supabase = await createClient();
	const role = await checkKoudenPermission(id);

	if (role !== "owner") {
		throw new Error("削除権限がありません");
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
		.eq("name", "viewer")
		.single();

	if (!viewerRole) {
		throw new Error("閲覧者ロールの取得に失敗しました");
	}

	await supabase.from("kouden_members").delete().eq("kouden_id", id).neq("user_id", user.id);

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
	const role = await checkKoudenPermission(id);

	if (role !== "owner") {
		throw new Error("アーカイブ権限がありません");
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

/**
 * 香典帳の複製
 * @param id 香典帳ID
 * @returns 複製された香典帳
 */
export async function duplicateKouden(id: string): Promise<{ kouden?: Kouden; error?: string }> {
	try {
		const supabase = await createClient();
		const role = await checkKoudenPermission(id);

		if (!role || (role !== "owner" && role !== "editor")) {
			return { error: "複製権限がありません" };
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { error: "認証が必要です" };
		}

		// 1. 元の香典帳の情報を取得
		const { data: originalKouden, error: koudenError } = await supabase
			.from("koudens")
			.select("title, description")
			.eq("id", id)
			.single();

		if (koudenError) {
			throw koudenError;
		}

		// 2. 新しい香典帳を作成
		const { data: newKouden, error: createError } = await supabase
			.from("koudens")
			.insert({
				title: `${originalKouden.title}（コピー）`,
				description: originalKouden.description,
				owner_id: user.id,
				created_by: user.id,
			})
			.select("*")
			.single();

		if (createError) {
			throw createError;
		}

		// 3. オーナー情報を取得
		const { data: owner, error: ownerError } = await supabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", user.id)
			.single();

		if (ownerError) {
			throw ownerError;
		}

		// 4. 編集者ロールを取得
		const { data: ownerRole, error: roleError } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", newKouden.id)
			.eq("name", KOUDEN_ROLES.EDITOR)
			.single();

		if (!ownerRole || roleError) {
			throw new Error("編集者ロールの取得に失敗しました");
		}

		// 5. メンバーとして登録
		const { error: memberError } = await supabase.from("kouden_members").insert({
			kouden_id: newKouden.id,
			user_id: user.id,
			role_id: ownerRole.id,
			added_by: user.id,
		});

		if (memberError) {
			throw memberError;
		}

		// 6. 元の香典帳の関係性を取得
		const { data: relationships, error: relationshipsError } = await supabase
			.from("relationships")
			.select("id, name, description")
			.eq("kouden_id", id);

		if (relationshipsError) {
			throw relationshipsError;
		}

		// 7. 関係性を新しい香典帳にコピー
		if (relationships.length > 0) {
			const { error: copyRelationshipsError } = await supabase.from("relationships").insert(
				relationships.map((rel) => ({
					kouden_id: newKouden.id,
					name: rel.name,
					description: rel.description,
					is_default: false,
					created_by: user.id,
				})),
			);

			if (copyRelationshipsError) {
				throw copyRelationshipsError;
			}
		}

		// 8. 元の香典帳のエントリー情報を取得
		const { data: entries, error: entriesError } = await supabase
			.from("kouden_entries")
			.select(`
				id,
				name,
				organization,
				position,
				amount,
				postal_code,
				address,
				phone_number,
				attendance_type,
				has_offering,
				is_return_completed,
				notes,
				relationship_id
			`)
			.eq("kouden_id", id);

		if (entriesError) {
			throw entriesError;
		}

		// 9. エントリー情報を新しい香典帳にコピー
		const entryIdMap = new Map<string, string>();
		if (entries.length > 0) {
			const { data: newEntries, error: copyEntriesError } = await supabase
				.from("kouden_entries")
				.insert(
					entries.map((entry) => ({
						...entry,
						id: undefined, // 新しいUUIDを生成させる
						kouden_id: newKouden.id,
						created_by: user.id,
						relationship_id: null, // 関係性IDは一旦nullにする（後で更新）
					})),
				)
				.select("id");

			if (copyEntriesError || !newEntries) {
				throw copyEntriesError || new Error("Failed to copy entries");
			}

			// エントリーIDのマッピングを作成
			entries.forEach((oldEntry, index) => {
				if (newEntries?.[index]?.id) {
					entryIdMap.set(oldEntry.id, newEntries[index].id);
				}
			});

			// 10. 関係性IDのマッピングを作成
			const { data: newRelationships } = await supabase
				.from("relationships")
				.select("id, name")
				.eq("kouden_id", newKouden.id);

			const relationshipMap = new Map(
				relationships
					.filter((rel) => rel.name !== null)
					.map((oldRel, index) => {
						const newId = newRelationships?.[index]?.id;
						return newId ? [oldRel.name, newId] : null;
					})
					.filter((item): item is [string, string] => item !== null),
			);

			// 11. 関係性IDを更新
			for (let i = 0; i < entries.length; i++) {
				const oldEntry = entries[i];
				if (!oldEntry) continue;
				const newEntryId = entryIdMap.get(oldEntry.id);
				const oldRelationship = oldEntry.relationship_id
					? relationships.find((rel) => rel.id === oldEntry.relationship_id)
					: null;
				if (oldRelationship && newEntryId) {
					const newRelationshipId = relationshipMap.get(oldRelationship.name);
					if (newRelationshipId) {
						await supabase
							.from("kouden_entries")
							.update({ relationship_id: newRelationshipId })
							.eq("id", newEntryId);
					}
				}
			}

			// 12. 供物情報を取得してコピー
			const { data: offerings, error: offeringsError } = await supabase
				.from("offerings")
				.select(`
					*,
					offering_entries!inner (
						kouden_entry_id
					)
				`)
				.in(
					"id",
					entries.map((e) => e.id),
				);

			if (offeringsError) {
				throw offeringsError;
			}

			if (offerings && offerings.length > 0) {
				// まず供物を複製
				const { data: newOfferings, error: copyOfferingsError } = await supabase
					.from("offerings")
					.insert(
						offerings.map((offering) => ({
							type: offering.type,
							description: offering.description,
							quantity: offering.quantity,
							price: offering.price,
							provider_name: offering.provider_name,
							notes: offering.notes,
							created_by: offering.created_by,
							kouden_id: newKouden.id,
						})),
					)
					.select();

				if (copyOfferingsError || !newOfferings) {
					throw copyOfferingsError || new Error("Failed to copy offerings");
				}

				// 次に offering_entries を作成
				const { error: copyOfferingEntriesError } = await supabase.from("offering_entries").insert(
					offerings
						.filter(
							(offering, index) =>
								offering.offering_entries?.[0]?.kouden_entry_id &&
								newOfferings?.[index]?.id &&
								entryIdMap.has(offering.offering_entries[0].kouden_entry_id),
						)
						.map((offering, index) => {
							const newOffering = newOfferings?.find((_, i) => i === index);
							const entryId = offering.offering_entries?.[0]?.kouden_entry_id;
							const mappedEntryId = entryId && entryIdMap.get(entryId);

							if (!(newOffering?.id && mappedEntryId)) return null;

							return {
								offering_id: newOffering.id,
								kouden_entry_id: mappedEntryId,
								created_by: user.id,
							};
						})
						.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
				);

				if (copyOfferingEntriesError) {
					throw copyOfferingEntriesError;
				}
			}

			// 13. 返礼品情報を取得してコピー
			const { data: returnItems, error: returnItemsError } = await supabase
				.from("return_items")
				.select("*")
				.in(
					"kouden_entry_id",
					entries.map((e) => e.id),
				);

			if (returnItemsError) {
				throw returnItemsError;
			}

			if (returnItems && returnItems.length > 0) {
				const { error: copyReturnItemsError } = await supabase.from("return_items").insert(
					returnItems.map((item) => {
						const newEntryId = entryIdMap.get(item.kouden_entry_id);
						if (!newEntryId) {
							throw new Error("Failed to map entry ID for return item");
						}
						return {
							...item,
							id: undefined,
							kouden_entry_id: newEntryId,
							created_by: user.id,
						};
					}),
				);

				if (copyReturnItemsError) {
					throw copyReturnItemsError;
				}
			}
		}

		return {
			kouden: {
				...newKouden,
				owner,
			} as unknown as Kouden,
		};
	} catch (error) {
		console.error("[ERROR] Error duplicating kouden:", error);
		return { error: "香典帳の複製に失敗しました" };
	}
}
