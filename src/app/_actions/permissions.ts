"use server";

/**
 * 香典帳の権限チェック API
 *
 * ## 使い分け
 *
 * ### 読み取り用（boolean / role）
 * - `getKoudenPermission` — ロール取得。アクセス不可は `null`
 * - `hasKoudenAccess` — アクセス可能か
 * - `hasEditPermission` — 編集可能か（owner / editor）
 * - `isKoudenOwner` — オーナー相当か（`owner_id` または `created_by`）
 * - `canDeleteKouden` — 削除可能か（`owner_id` のみ。admin client 利用のため厳格化）
 *
 * ### 書き込み用（throw）
 * - `requireKoudenAccess` — アクセス権必須（ロールを返す）
 * - `requireKoudenEditor` — 編集権限必須
 * - `requireKoudenOwner` — オーナー権限必須
 *
 * ### 後方互換
 * - `checkKoudenPermission` — `requireKoudenAccess` のエイリアス
 *
 * すべての判定は `fetchKoudenAccess`（left join 1 クエリ）を共有する。
 * RLS 無限再帰を避けるため、inner join は使用しない。
 */

import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { KoudenPermission } from "@/types/role";
import { cache } from "react";

type KoudenMemberRow = {
	role_id: string;
	user_id: string;
	kouden_roles: { name: string } | null;
};

type KoudenAccessRow = {
	owner_id: string;
	created_by: string;
	kouden_members: KoudenMemberRow[] | null;
};

type KoudenAccessContext = {
	userId: string;
	row: KoudenAccessRow;
};

const fetchKoudenAccess = cache(async (koudenId: string): Promise<KoudenAccessContext | null> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	const { data, error } = await supabase
		.from("koudens")
		.select(`
			owner_id,
			created_by,
			kouden_members!left (
				role_id,
				user_id,
				kouden_roles (
					name
				)
			)
		`)
		.eq("id", koudenId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw new KoudenError("権限の取得に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (!data) {
		return null;
	}

	return { userId: user.id, row: data };
});

function isRecordOwner(userId: string, row: KoudenAccessRow): boolean {
	return row.owner_id === userId;
}

function resolveKoudenPermission(
	userId: string,
	row: KoudenAccessRow,
): KoudenPermission | null {
	if (row.owner_id === userId || row.created_by === userId) {
		return "owner";
	}

	const userMember = row.kouden_members?.find((member) => member.user_id === userId);
	const roleName = userMember?.kouden_roles?.name;

	if (roleName === "editor") return "editor";
	if (roleName === "viewer") return "viewer";

	return null;
}

/**
 * ユーザーの香典帳に対するロールを取得する（読み取り用）
 * @returns アクセス可能な場合はロール、それ以外は null
 */
export const getKoudenPermission = cache(
	async (koudenId: string): Promise<KoudenPermission | null> => {
		const access = await fetchKoudenAccess(koudenId);
		if (!access) {
			return null;
		}

		return resolveKoudenPermission(access.userId, access.row);
	},
);

/**
 * 香典帳へのアクセス権を要求する（書き込み用）
 * @returns ユーザーのロール
 */
export async function requireKoudenAccess(
	koudenId: string,
	message = "アクセス権限がありません",
): Promise<KoudenPermission> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
	}

	const permission = await getKoudenPermission(koudenId);
	if (!permission) {
		throw new KoudenError(message, ErrorCodes.FORBIDDEN);
	}

	return permission;
}

/**
 * 香典帳へのアクセス権を要求する（後方互換エイリアス）
 */
export const checkKoudenPermission = cache(requireKoudenAccess);

/**
 * 香典帳にアクセスできるか（読み取り用）
 */
export const hasKoudenAccess = cache(async (koudenId: string): Promise<boolean> => {
	const permission = await getKoudenPermission(koudenId);
	return permission !== null;
});

/**
 * 香典帳の編集権限（owner / editor）を要求する（書き込み用）
 */
export async function requireKoudenEditor(
	koudenId: string,
	message = "編集権限がありません",
): Promise<void> {
	const permission = await requireKoudenAccess(koudenId, message);
	if (permission !== "owner" && permission !== "editor") {
		throw new KoudenError(message, ErrorCodes.FORBIDDEN);
	}
}

/**
 * 香典帳のオーナー権限を要求する（書き込み用）
 * `owner_id` または `created_by` をオーナー相当として扱う。
 */
export async function requireKoudenOwner(
	koudenId: string,
	message = "オーナー権限がありません",
): Promise<void> {
	const permission = await requireKoudenAccess(koudenId, message);
	if (permission !== "owner") {
		throw new KoudenError(message, ErrorCodes.FORBIDDEN);
	}
}

/**
 * 香典帳レコードの `owner_id` を要求する（書き込み用）
 * admin client 等 RLS をバイパスする削除では `created_by` を許可しない。
 */
export async function requireKoudenRecordOwner(
	koudenId: string,
	message = "オーナー権限がありません",
): Promise<void> {
	await requireKoudenAccess(koudenId, message);
	const access = await fetchKoudenAccess(koudenId);
	if (!access || !isRecordOwner(access.userId, access.row)) {
		throw new KoudenError(message, ErrorCodes.FORBIDDEN);
	}
}

/**
 * オーナー権限があるか（読み取り用）
 */
export const isKoudenOwner = cache(async (koudenId: string): Promise<boolean> => {
	const permission = await getKoudenPermission(koudenId);
	return permission === "owner";
});

/**
 * 編集権限があるか（読み取り用）
 */
export const hasEditPermission = cache(async (koudenId: string): Promise<boolean> => {
	const permission = await getKoudenPermission(koudenId);
	return permission === "owner" || permission === "editor";
});

/**
 * 削除権限があるか（読み取り用、オーナーのみ）
 */
export const canDeleteKouden = cache(async (koudenId: string): Promise<boolean> => {
	const access = await fetchKoudenAccess(koudenId);
	if (!access) {
		return false;
	}
	return isRecordOwner(access.userId, access.row);
});
