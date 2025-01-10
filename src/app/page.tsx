import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// 認証状態に応じてリダイレクト
	if (user) {
		redirect("/koudens");
	} else {
		redirect("/login");
	}
}
