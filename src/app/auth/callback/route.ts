import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");

	if (code) {
		const supabase = await createClient();
		const cookieStore = cookies();

		await supabase.auth.exchangeCodeForSession(code);
	}

	return NextResponse.redirect(new URL("/koudens", request.url));
}
