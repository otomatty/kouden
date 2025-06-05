"use server";

import { createClient } from "@/lib/supabase/server";
import type { Kouden } from "@/types/kouden";
import type { Entry } from "@/types/entries";
import { checkKoudenPermission } from "../permissions";
import type { Database } from "@/types/supabase";
type Plan = Database["public"]["Tables"]["plans"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type KoudenWithPlan = Kouden & {
	owner?: Profile;
	plan: Plan;
	expired: boolean;
	remainingDays?: number;
};

/**
 * ユーザーが所属しているすべての香典帳を取得
 */
export async function getKoudens(): Promise<{ koudens?: KoudenWithPlan[]; error?: string }> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { error: "認証が必要です" };
		}

		// メンバーとして参加している香典帳のIDを取得
		const { data: memberKoudens } = await supabase
			.from("kouden_members")
			.select("kouden_id")
			.eq("user_id", user.id);

		const memberKoudenIds = memberKoudens?.map((m) => m.kouden_id) || [];

		// 香典帳を取得（オーナーまたはメンバー）
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
        status,
        plan_id
      `)
			.or(`owner_id.eq.${user.id},id.in.(${memberKoudenIds.join(",")})`)
			.order("created_at", { ascending: false });

		if (error) throw error;

		// オーナー情報を取得
		const ownerIds = [...new Set(koudens?.map((k) => k.owner_id) || [])];
		const { data: profiles } = await supabase
			.from("profiles")
			.select("id, display_name, avatar_url, created_at, updated_at")
			.in("id", ownerIds);

		// プラン情報を取得
		const planIds = [...new Set(koudens.map((k) => k.plan_id))];
		const { data: plans, error: plansError } = await supabase
			.from("plans")
			.select("id, code, name, description, features, price, created_at, updated_at")
			.in("id", planIds);
		if (plansError) throw plansError;
		const planMap: Record<string, Plan> = plans.reduce(
			(acc, p) => {
				acc[p.id] = p;
				return acc;
			},
			{} as Record<string, Plan>,
		);
		// 有料・期限切れ情報を付与
		const results = koudens.map((k) => {
			const plan = planMap[k.plan_id];
			if (!plan) {
				throw new Error(`Plan not found for id ${k.plan_id}`);
			}
			let expired = false;
			let remainingDays: number | undefined;
			if (plan.code === "free") {
				const ageMs = Date.now() - new Date(k.created_at).getTime();
				const ageDays = ageMs / (1000 * 60 * 60 * 24);
				if (ageDays >= 14) {
					expired = true;
					remainingDays = 0;
				} else {
					remainingDays = Math.ceil(14 - ageDays);
				}
			}
			return {
				...k,
				owner: profiles?.find((p) => p.id === k.owner_id),
				plan,
				expired,
				remainingDays,
			};
		});
		return { koudens: results };
	} catch (error) {
		console.error("[ERROR] Error getting koudens:", error);
		return { error: "香典帳の取得に失敗しました" };
	}
}

/**
 * 香典帳の取得
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

/**
 * 香典帳と記帳データの取得
 */
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

	return { kouden: { ...kouden, owner }, entries: entries as unknown as Entry[] };
}

/**
 * 香典帳のプラン情報を取得
 * @param id 香典帳ID
 * @returns plan情報と無料プラン期限切れフラグ
 */
export async function getKoudenWithPlan(id: string) {
	const supabase = await createClient();
	// 香典帳からplan_idと作成日時を取得
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("plan_id, created_at")
		.eq("id", id)
		.single();
	if (koudenError || !kouden) {
		throw new Error("香典帳の取得に失敗しました");
	}
	// プラン情報を取得
	const { data: plan, error: planError } = await supabase
		.from("plans")
		.select("*")
		.eq("id", kouden.plan_id)
		.single();
	if (planError || !plan) {
		throw new Error("プラン情報の取得に失敗しました");
	}
	// 無料プランの期限切れ判定
	let expired = false;
	let remainingDays: number | undefined;
	if (plan.code === "free") {
		const ageMs = Date.now() - new Date(kouden.created_at).getTime();
		const ageDays = ageMs / (1000 * 60 * 60 * 24);
		if (ageDays >= 14) {
			expired = true;
			remainingDays = 0;
		} else {
			remainingDays = Math.ceil(14 - ageDays);
		}
	}
	return { plan, expired, remainingDays };
}
