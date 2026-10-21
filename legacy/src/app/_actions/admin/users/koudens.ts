"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { escapeIlikePattern } from "@/lib/security/search-sanitize";
import { createClient } from "@/lib/supabase/server";
import type { AdminKoudenListItem, GetAdminKoudensParams } from "./types";

/**
 * 管理者用: 全香典帳一覧を取得
 */
export async function getAllKoudens(params: GetAdminKoudensParams = {}): Promise<
	ActionResult<{
		koudens: AdminKoudenListItem[];
		total: number;
		hasMore: boolean;
	}>
> {
	return withActionResult(async () => {
		// 管理者用にサービスロールクライアントを使用（RLSをバイパス）
		const { createAdminClient } = await import("@/lib/supabase/admin");
		const supabase = createAdminClient();
		const {
			page = 1,
			limit = 20,
			search,
			status = "all",
			sortBy = "created_at",
			sortOrder = "desc",
		} = params;
		const offset = (page - 1) * limit;

		// 管理者権限をチェック（通常のクライアントで）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();

		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 統計やソート RPC は内部で is_admin(auth.uid()) を検証するため、
		// サービスロールではなくユーザーセッションのクライアントで呼び出す。
		const sessionClient = await createClient();

		const KOUDEN_BASE_SELECT = `
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        owner_id,
        plan_id
      `;
		type KoudenBaseRow = {
			id: string;
			title: string;
			description: string | null;
			status: string;
			created_at: string;
			updated_at: string;
			owner_id: string;
			plan_id: string;
		};

		// 1. 香典帳の基本情報とページ全体の総件数を取得。
		// entries_count ソートのみ DB 側で全件ソート + ページネーションするため別経路。
		let koudens: KoudenBaseRow[];
		let count: number;

		if (sortBy === "entries_count") {
			// entries_count は kouden_entries の集計値（計算列）のため、JS側で現ページ内
			// だけを並べ替えると全件ソートにならない。DB 側 (RPC) で集計を含めて全件ソート +
			// ページネーションし、正しい順序の kouden_id と全件数を取得する。
			// 注: get_admin_kouden_ids_by_entries_count は
			//   20260608000003_add_admin_sorted_page_rpcs.sql で追加。
			const orderedResult = await (
				sessionClient.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_admin_kouden_ids_by_entries_count", {
				p_search: search ? escapeIlikePattern(search) : null,
				p_status: status,
				p_sort_order: sortOrder,
				p_limit: limit,
				p_offset: offset,
			});

			if (orderedResult.error) {
				throw new KoudenError(
					`Failed to fetch sorted kouden ids: ${orderedResult.error.message}`,
					ErrorCodes.DB_FETCH_ERROR,
				);
			}

			// RPC は全件数を常に返す（ページが空でも id = NULL のセンチネル行で total_count
			// を返す）。total はページ行に依存せず先頭行の total_count から読み、順序付き ID は
			// id = NULL を除外して組み立てる。
			const orderedRows = (orderedResult.data ?? []) as Array<{
				id: string | null;
				total_count: number | string;
			}>;
			count = Number(orderedRows[0]?.total_count ?? 0);

			const orderedIds = orderedRows.map((row) => row.id).filter((id): id is string => id !== null);

			if (orderedIds.length === 0) {
				return { koudens: [], total: count, hasMore: false };
			}
			const { data: fetchedKoudens, error: koudensError } = await supabase
				.from("koudens")
				.select(KOUDEN_BASE_SELECT)
				.in("id", orderedIds);
			if (koudensError) throw koudensError;

			// RPC が返したソート順を保持して並べ直す（.in() は順序を保証しないため）
			const koudenMap = new Map((fetchedKoudens ?? []).map((k) => [k.id, k as KoudenBaseRow]));
			koudens = orderedIds
				.map((id) => koudenMap.get(id))
				.filter((k): k is KoudenBaseRow => k !== undefined);
		} else {
			let query = supabase.from("koudens").select(KOUDEN_BASE_SELECT, { count: "exact" });

			// 検索条件 (ILIKE のワイルドカード % _ は意図しない一致を生むためエスケープ)
			if (search) {
				query = query.ilike("title", `%${escapeIlikePattern(search)}%`);
			}

			// ステータスフィルタリング
			if (status !== "all") {
				query = query.eq("status", status);
			}

			// ソート
			query = query.order(sortBy, { ascending: sortOrder === "asc" });

			// ページネーション
			query = query.range(offset, offset + limit - 1);

			const { data: fetchedKoudens, error: koudensError, count: fetchedCount } = await query;
			if (koudensError) throw koudensError;

			if (!fetchedKoudens || fetchedKoudens.length === 0) {
				return { koudens: [], total: fetchedCount || 0, hasMore: false };
			}

			koudens = fetchedKoudens as KoudenBaseRow[];
			count = fetchedCount || 0;
		}

		// 2. オーナー / プラン / 統計を ID 群でまとめて一括取得（N+1解消）
		const ownerIds = Array.from(new Set(koudens.map((k) => k.owner_id)));
		const planIds = Array.from(new Set(koudens.map((k) => k.plan_id)));
		const koudenIds = koudens.map((k) => k.id);

		// 注: get_admin_kouden_stats は 20260608000000_add_get_admin_kouden_stats_rpc.sql で追加。
		// マイグレーション適用後に `bun run db:types` を実行すれば、ここのキャストは不要になる。
		const [ownersResult, plansResult, statsResult] = await Promise.all([
			supabase.from("profiles").select("id, display_name, avatar_url").in("id", ownerIds),
			supabase.from("plans").select("id, code, name").in("id", planIds),
			(
				sessionClient.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_admin_kouden_stats", { p_kouden_ids: koudenIds }),
		]);

		// 取得エラーはサイレントに「不明」化せず、明示的に例外を投げる
		if (ownersResult.error) {
			throw new KoudenError(
				`Failed to fetch kouden owners: ${ownersResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}
		if (plansResult.error) {
			throw new KoudenError(
				`Failed to fetch kouden plans: ${plansResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}

		const ownerMap = new Map((ownersResult.data ?? []).map((owner) => [owner.id, owner] as const));
		const planMap = new Map((plansResult.data ?? []).map((plan) => [plan.id, plan] as const));

		if (statsResult.error) {
			// 失敗時は0埋めで継続せず、明示的に例外を投げる（admin UIで誤った0統計を出さないため）
			throw new KoudenError(
				`Failed to fetch kouden aggregate stats: ${statsResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}

		type KoudenStatsRow = {
			kouden_id: string;
			entries_count: number | string;
			members_count: number | string;
			total_amount: number | string;
		};
		const statsRows = (statsResult.data ?? []) as KoudenStatsRow[];
		const statsMap = new Map(statsRows.map((row) => [row.kouden_id, row] as const));

		// 取得「全体」の失敗（ownersResult/plansResult/statsResult の error）は上で例外化済み。
		// 以降の ownerMap/planMap/statsMap.get に対するフォールバックは「個別レコードの欠損」
		// （削除済み owner、未登録 plan、エントリー0件の kouden 等）を正常系として扱うもので、
		// owner/plan は「不明」プレースホルダ、stats は 0 埋めで継続する。
		const koudensWithDetails = koudens.map((kouden) => {
			const owner = ownerMap.get(kouden.owner_id) ?? {
				id: kouden.owner_id,
				display_name: "不明",
				avatar_url: null,
			};
			const plan = planMap.get(kouden.plan_id) ?? {
				id: kouden.plan_id,
				code: "unknown",
				name: "不明",
			};
			const statsRow = statsMap.get(kouden.id);
			const stats = {
				entries_count: Number(statsRow?.entries_count ?? 0),
				members_count: Number(statsRow?.members_count ?? 0),
				total_amount: Number(statsRow?.total_amount ?? 0),
			};

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

			return {
				...kouden,
				status: kouden.status as "active" | "archived" | "inactive",
				owner,
				plan,
				stats,
				expired,
				remainingDays,
			};
		});

		// 並び順は koudens の順序（通常パスはクエリ、entries_count パスは RPC で
		// 全件ソート済み）をそのまま保持するため、ここでの再ソートは不要。
		return {
			koudens: koudensWithDetails,
			total: count,
			hasMore: count > offset + limit,
		};
	}, "香典帳一覧の取得");
}
