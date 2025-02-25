import { createClient } from "@/lib/supabase/server";

export async function getUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}

export async function getUserId() {
	const user = await getUser();
	if (!user) {
		return null;
	}
	return user.id;
}
