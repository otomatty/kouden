import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvitationAcceptForm } from "./_components/invitation-accept-form";

interface InvitationPageProps {
	params: {
		token: string;
	};
}

export default async function InvitationPage({ params }: InvitationPageProps) {
	const { token } = params;
	const supabase = await createClient();

	// セッションの確認
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		// 未ログインの場合は、ログインページにリダイレクト（トークンを保持）
		redirect(`/auth/login?invitation=${token}`);
	}

	// 招待情報の取得
	const { data: invitation } = await supabase
		.from("kouden_invitations")
		.select(`
			*,
			kouden:koudens!inner(
				title,
				owner_id,
				owner_profile:profiles!owner_id(
					display_name
				)
			)
		`)
		.eq("invitation_token", token)
		.is("accepted_at", null)
		.gt("expires_at", new Date().toISOString())
		.single();

	if (!invitation) {
		return (
			<div className="container max-w-2xl py-8">
				<div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
					<h1 className="text-2xl font-bold">無効な招待リンク</h1>
					<p className="mt-2 text-muted-foreground">
						この招待リンクは無効か、既に使用済みです。
					</p>
				</div>
			</div>
		);
	}

	// メールアドレスの確認
	if (invitation.email !== user.email) {
		return (
			<div className="container max-w-2xl py-8">
				<div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
					<h1 className="text-2xl font-bold">メールアドレスが一致しません</h1>
					<p className="mt-2 text-muted-foreground">
						この招待は{invitation.email}宛に送信されました。
						招待されたメールアドレスでログインしてください。
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container max-w-2xl py-8">
			<div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
				<h1 className="text-2xl font-bold">香典帳への招待</h1>
				<div className="mt-4 space-y-4">
					<p>
						{invitation.kouden?.owner_profile?.display_name}さんから 「
						{invitation.kouden?.title}」への招待が届いています。
					</p>
					<p>
						あなたは
						<span className="font-medium">
							{invitation.role === "editor" ? "編集者" : "閲覧者"}
						</span>
						として招待されました。
					</p>
					<InvitationAcceptForm token={token} />
				</div>
			</div>
		</div>
	);
}
