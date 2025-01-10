import { createClient } from "@/lib/supabase/server";
import { createInvitation } from "@/app/_actions/invitations";
import { NextResponse } from "next/server";
import { z } from "zod";

const inviteSchema = z.object({
	koudenId: z.string(),
	email: z.string().email(),
	role: z.enum(["viewer", "editor"]),
});

export async function POST(request: Request) {
	try {
		const supabase = await createClient();

		// セッションの確認
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
		}

		// リクエストボディの検証
		const body = await request.json();
		const result = inviteSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ message: "無効なリクエストです" },
				{ status: 400 },
			);
		}

		const { koudenId, email, role } = result.data;

		// 香典帳の所有者かどうかを確認
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (!kouden) {
			return NextResponse.json(
				{ message: "香典帳が見つかりません" },
				{ status: 404 },
			);
		}

		if (kouden.owner_id !== user.id) {
			return NextResponse.json(
				{ message: "権限がありません" },
				{ status: 403 },
			);
		}

		// 招待を作成
		const { error } = await createInvitation({
			koudenId,
			email,
			role,
			userId: user.id,
		});

		if (error) {
			return NextResponse.json({ message: error }, { status: 500 });
		}

		return NextResponse.json(
			{ message: "招待を送信しました" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error inviting member:", error);
		return NextResponse.json(
			{ message: "招待の送信に失敗しました" },
			{ status: 500 },
		);
	}
}
