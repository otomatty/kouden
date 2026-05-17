"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { KoudenWithOwner } from "@/types/kouden";
import { KOUDEN_ROLES } from "@/types/role";
import { checkKoudenPermission } from "../permissions";

/**
 * 香典帳の複製（デフォルトで free プラン適用）
 * @param id 香典帳ID
 * @returns 複製された香典帳の `ActionResult`
 */
export async function duplicateKouden(id: string): Promise<ActionResult<KoudenWithOwner>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const role = await checkKoudenPermission(id);
		if (!role || (role !== "owner" && role !== "editor")) {
			throw new KoudenError("複製権限がありません", ErrorCodes.FORBIDDEN);
		}

		const { data: authData, error: authError } = await supabase.auth.getUser();
		const user = authData.user;
		if (authError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// 1. 元の香典帳情報取得
		const { data: original, error: origError } = await supabase
			.from("koudens")
			.select("title, description, plan_id")
			.eq("id", id)
			.single();
		if (origError || !original) {
			throw origError ?? new KoudenError("香典帳の取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
		}

		// 複製元は有料プランのみ
		const { data: origPlanData, error: origPlanError } = await supabase
			.from("plans")
			.select("code")
			.eq("id", original.plan_id)
			.single();
		if (origPlanError || !origPlanData) {
			throw (
				origPlanError ?? new KoudenError("プランの取得に失敗しました", ErrorCodes.DB_FETCH_ERROR)
			);
		}
		if (origPlanData.code === "free") {
			throw new KoudenError("無料プランの香典帳は複製できません", ErrorCodes.INVALID_OPERATION);
		}

		// freeプランID取得
		const { data: freePlan, error: planError } = await supabase
			.from("plans")
			.select("id")
			.eq("code", "free")
			.single();
		if (planError || !freePlan) {
			throw new KoudenError("プランの取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
		}

		// 2. 新しい香典帳作成
		const { data: newKouden, error: createError } = await supabase
			.from("koudens")
			.insert({
				title: `${original.title}（コピー）`,
				description: original.description,
				owner_id: user.id,
				created_by: user.id,
				plan_id: freePlan.id,
			})
			.select("*")
			.single();
		if (createError || !newKouden) {
			throw (
				createError ?? new KoudenError("香典帳の作成に失敗しました", ErrorCodes.DB_INSERT_ERROR)
			);
		}

		// 3. オーナー情報取得
		const { data: owner, error: ownerError } = await supabase
			.from("profiles")
			.select("id, display_name")
			.eq("id", user.id)
			.single();
		if (ownerError || !owner) {
			throw (
				ownerError ?? new KoudenError("オーナー情報の取得に失敗しました", ErrorCodes.DB_FETCH_ERROR)
			);
		}

		// 4. 編集者ロール取得
		const { data: ownerRole, error: roleErr } = await supabase
			.from("kouden_roles")
			.select("id")
			.eq("kouden_id", newKouden.id)
			.eq("name", KOUDEN_ROLES.EDITOR)
			.single();
		if (!ownerRole || roleErr) {
			throw new KoudenError("編集者ロールの取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
		}

		// 5. メンバー登録
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
					notes,
					relationship_id
				`) // prettier-ignore
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
						id: undefined,
						kouden_id: newKouden.id,
						created_by: user.id,
						relationship_id: null,
					})),
				)
				.select("id");
			if (copyEntriesError || !newEntries) {
				throw (
					copyEntriesError ??
					new KoudenError("エントリーの複製に失敗しました", ErrorCodes.DB_INSERT_ERROR)
				);
			}

			entries.forEach((oldEntry, index) => {
				if (newEntries[index]?.id) {
					entryIdMap.set(oldEntry.id, newEntries[index].id);
				}
			});

			// 10. 関係性IDを更新
			const { data: newRelationships, error: newRelError } = await supabase
				.from("relationships")
				.select("id, name")
				.eq("kouden_id", newKouden.id);
			if (newRelError || !newRelationships) {
				throw new KoudenError("新しい関係性の取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
			}
			const relationshipMap = new Map(
				relationships
					.filter((rel) => rel.name !== null)
					.map((oldRel, idx) => {
						const newRel = newRelationships[idx];
						return newRel ? [oldRel.name, newRel.id] : null;
					})
					.filter((item): item is [string, string] => item !== null),
			);
			for (const oldEntry of entries) {
				const newEntryId = entryIdMap.get(oldEntry.id);
				const oldRel = oldEntry.relationship_id
					? relationships.find((r) => r.id === oldEntry.relationship_id)
					: null;
				if (oldRel && newEntryId) {
					const newRelId = relationshipMap.get(oldRel.name);
					if (newRelId) {
						await supabase
							.from("kouden_entries")
							.update({ relationship_id: newRelId })
							.eq("id", newEntryId);
					}
				}
			}

			// 11. 供物情報を取得してコピー
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
			if (offerings.length > 0) {
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
					throw (
						copyOfferingsError ??
						new KoudenError("供物の複製に失敗しました", ErrorCodes.DB_INSERT_ERROR)
					);
				}

				// 12. offering_entriesのコピー
				const { error: copyOfferingEntriesError } = await supabase.from("offering_entries").insert(
					offerings
						.filter(
							(offering, idx) =>
								offering.offering_entries?.[0]?.kouden_entry_id &&
								newOfferings[idx]?.id &&
								entryIdMap.has(offering.offering_entries[0].kouden_entry_id),
						)
						.map((offering, idx) => {
							const newOff = newOfferings[idx];
							// offerings entries must exist
							const firstEntry = offering.offering_entries?.[0];
							if (!firstEntry) return null;
							if (!newOff?.id) return null;
							const oldEntryId = firstEntry.kouden_entry_id;
							const newEntryId = entryIdMap.get(oldEntryId);
							if (!newEntryId) return null;
							return {
								offering_id: newOff.id,
								kouden_entry_id: newEntryId,
								created_by: user.id,
							};
						})
						.filter((o): o is NonNullable<typeof o> => o !== null),
				);
				if (copyOfferingEntriesError) {
					throw copyOfferingEntriesError;
				}
			}

			// 13. 返礼品情報を取得してコピー
			const { data: returnItems, error: returnItemsError } = await supabase
				.from("return_record_items")
				.select("*")
				.in(
					"return_record_id",
					entries.map((e) => e.id),
				);
			if (returnItemsError) {
				throw returnItemsError;
			}
			if (returnItems.length > 0) {
				const { error: copyReturnItemsError } = await supabase.from("return_record_items").insert(
					returnItems.map((item) => {
						const newEntryId = entryIdMap.get(item.return_record_id);
						if (!newEntryId) {
							throw new KoudenError(
								"返礼品IDのマッピングに失敗しました",
								ErrorCodes.INVALID_OPERATION,
							);
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

		return { ...newKouden, owner };
	}, "香典帳の複製");
}
