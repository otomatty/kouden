import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const { name, typeId } = await request.json();
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const userId = user.id;
		const { data, error } = await supabase
			.schema("common")
			.from("organizations")
			.insert({ name, type_id: typeId, requested_by: userId });
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ data }, { status: 201 });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unexpected error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
