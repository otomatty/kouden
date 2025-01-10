import { createClient } from "@/lib/supabase/server";
import { KoudenList } from "./_components/kouden-list";
import { CreateKoudenForm } from "./_components/create-kouden-form";

export default async function KoudensPage() {
	const supabase = await createClient();
	const { data: koudens } = await supabase
		.from("koudens")
		.select("*")
		.order("created_at", { ascending: false });

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
