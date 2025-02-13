import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasValidEnv = supabaseUrl && supabaseAnonKey;
if (!hasValidEnv) {
	throw new Error("Missing Supabase environment variables");
}

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}
				supabaseResponse = NextResponse.next({
					request,
				});
				for (const { name, value, options } of cookiesToSet) {
					supabaseResponse.cookies.set(name, value, options);
				}
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const publicPaths = ["/auth/login", "/auth"];
	const requiresAuth = !publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));
	if (requiresAuth && !user) {
		const url = request.nextUrl.clone();
		url.pathname = "/auth/login";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
