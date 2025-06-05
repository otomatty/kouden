import type { Metadata } from "next";
import { getPlans } from "@/app/_actions/plans";
import NewKoudenForm from "./NewKoudenForm";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = {
	title: "新規香典帳作成",
	description: "香典帳の新規作成ページです",
};

export default async function NewKoudenPage() {
	const { plans = [], error } = await getPlans();
	if (error) throw new Error(error);

	const supabase = await createClient();
	const { data, error: userError } = await supabase.auth.getUser();
	const user = data.user;
	if (userError || !user) {
		throw new Error("ユーザーが見つかりません");
	}

	return (
		<div className="max-w-2xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">香典帳を作成する</h1>
			<NewKoudenForm plans={plans} userId={user.id} />
		</div>
	);
}
