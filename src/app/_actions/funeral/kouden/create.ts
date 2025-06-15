"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOrganizationAccess } from "@/lib/access";

export interface CreateKoudenForCaseInput {
	caseId: string;
	title: string;
	description?: string;
}

export interface CreateKoudenForCaseResult {
	success: boolean;
	koudenId?: string;
	error?: string;
}

/**
 * 葬儀案件に対して香典帳を代理作成する
 */
export async function createKoudenForCase(
	input: CreateKoudenForCaseInput,
): Promise<CreateKoudenForCaseResult> {
	try {
		// 葬儀会社のアクセス権限をチェック
		await requireOrganizationAccess("funeral_company");

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 組織IDを取得
		const { data: orgData, error: orgError } = await supabase
			.schema("common")
			.from("organization_members")
			.select("organization_id")
			.eq("user_id", user.id)
			.single();

		if (orgError || !orgData) {
			return { success: false, error: "組織情報の取得に失敗しました" };
		}

		// 葬儀案件の存在確認
		const { data: funeralCase, error: caseError } = await supabase
			.schema("funeral")
			.from("cases")
			.select("id, deceased_name, organization_id")
			.eq("id", input.caseId)
			.eq("organization_id", orgData.organization_id)
			.single();

		if (caseError || !funeralCase) {
			return { success: false, error: "葬儀案件が見つかりません" };
		}

		// 既に香典帳が作成されていないかチェック
		const { data: existingKouden } = await supabase
			.schema("funeral")
			.from("kouden_cases")
			.select("id")
			.eq("case_id", input.caseId)
			.single();

		if (existingKouden) {
			return { success: false, error: "この案件には既に香典帳が作成されています" };
		}

		// ストアドプロシージャを呼び出して香典帳を作成
		const { data: koudenId, error: createError } = await supabase.rpc(
			"create_kouden_for_funeral_case",
			{
				p_case_id: input.caseId,
				p_organization_id: orgData.organization_id,
				p_proxy_manager_id: user.id,
				p_title: input.title,
				p_description: input.description || undefined,
			},
		);

		if (createError) {
			console.error("[ERROR] Failed to create kouden for case:", createError);
			return { success: false, error: "香典帳の作成に失敗しました" };
		}

		return {
			success: true,
			koudenId: koudenId as string,
		};
	} catch (error) {
		console.error("[ERROR] Error in createKoudenForCase:", error);
		return { success: false, error: "予期せぬエラーが発生しました" };
	}
}

/**
 * 葬儀案件に関連する香典帳情報を取得
 */
export async function getKoudenForCase(caseId: string) {
	try {
		await requireOrganizationAccess("funeral_company");

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		// 組織IDを取得
		const { data: orgData, error: orgError } = await supabase
			.schema("common")
			.from("organization_members")
			.select("organization_id")
			.eq("user_id", user.id)
			.single();

		if (orgError || !orgData) {
			throw new Error("組織情報の取得に失敗しました");
		}

		// 香典帳情報を取得
		const { data: koudenCase, error } = await supabase
			.schema("funeral")
			.from("kouden_cases")
			.select(`
				id,
				case_id,
				kouden_id,
				proxy_manager_id,
				family_user_id,
				status,
				created_at,
				updated_at
			`)
			.eq("case_id", caseId)
			.eq("organization_id", orgData.organization_id)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// レコードが見つからない場合
				return null;
			}
			throw error;
		}

		// 香典帳の詳細情報を別途取得
		const { data: koudenDetails } = await supabase
			.from("koudens")
			.select(`
				id,
				title,
				description,
				status,
				created_at,
				updated_at
			`)
			.eq("id", koudenCase.kouden_id)
			.single();

		// 香典帳詳細が取得できない場合でも、ケース情報は返す
		return {
			...koudenCase,
			koudens: koudenDetails || null,
		};
	} catch (error) {
		console.error("[ERROR] Error in getKoudenForCase:", error);
		throw error;
	}
}

/**
 * 香典帳の所有権をご遺族に移譲
 */
export async function transferKoudenOwnership(koudenId: string, newOwnerEmail: string) {
	try {
		await requireOrganizationAccess("funeral_company");

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "認証が必要です" };
		}

		// 新しい所有者のユーザーIDを取得
		const { data: newOwnerProfile, error: profileError } = await supabase
			.from("profiles")
			.select("id")
			.eq("email", newOwnerEmail)
			.single();

		if (profileError || !newOwnerProfile) {
			return { success: false, error: "指定されたメールアドレスのユーザーが見つかりません" };
		}

		// 所有権移譲を実行
		const { error: transferError } = await supabase.rpc("transfer_kouden_ownership", {
			p_kouden_id: koudenId,
			p_new_owner_id: newOwnerProfile.id,
			p_proxy_manager_id: user.id,
		});

		if (transferError) {
			console.error("[ERROR] Failed to transfer ownership:", transferError);
			return { success: false, error: "所有権の移譲に失敗しました" };
		}

		return { success: true };
	} catch (error) {
		console.error("[ERROR] Error in transferKoudenOwnership:", error);
		return { success: false, error: "予期せぬエラーが発生しました" };
	}
}
