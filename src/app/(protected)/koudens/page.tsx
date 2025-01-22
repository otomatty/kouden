import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { KoudenList } from "./_components/kouden-list";
import { CreateKoudenForm } from "./_components/create-kouden-form";
import { getKoudens } from "@/app/_actions/koudens";

export const metadata: Metadata = {
	title: "一覧 | 香典帳",
	description: "香典帳の一覧ページです",
};

export default async function KoudensPage() {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new Error("認証が必要です");
	}

	const { koudens = [], error } = await getKoudens({ userId: user.id });

	if (error) {
		throw new Error(error);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">香典帳一覧</h2>
				<CreateKoudenForm />
			</div>
			<KoudenList koudens={koudens || []} />
		</div>
	);
}
