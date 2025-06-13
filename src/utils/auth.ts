import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 現在のユーザーの組織IDを取得
 * organization_members中間テーブルから取得
 */
export async function getCurrentUserOrganizationId(): Promise<string> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/auth/signin");
	}

	// organization_membersから組織IDを取得
	const { data: membership, error } = await supabase
		.schema("common")
		.from("organization_members")
		.select("organization_id")
		.eq("user_id", user.id)
		.single();

	if (error || !membership?.organization_id) {
		throw new Error("ユーザーが組織に所属していません");
	}

	return membership.organization_id;
}
