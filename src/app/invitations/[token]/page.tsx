import { notFound } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getInvitation } from "@/app/_actions/invitations";
import { AcceptInvitationButton } from "./_components/accept-invitation-button";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/custom/login-button";

interface InvitationPageProps {
	params: Promise<{
		token: string;
	}>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
	const { token } = await params;
	try {
		const invitation = await getInvitation(token);
		const supabase = await createClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!invitation) {
			notFound();
		}

		return (
			<div className="container max-w-lg py-8">
				<Card>
					<CardHeader>
						<CardTitle>香典帳への招待</CardTitle>
						{session?.user && (
							<CardDescription>
								ログイン中のユーザー: {session.user.email}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h3 className="font-semibold">香典帳名</h3>
							<p>{invitation.kouden.title}</p>
							{invitation.kouden.description && (
								<p className="text-sm text-muted-foreground mt-1">
									{invitation.kouden.description}
								</p>
							)}
						</div>
						<div>
							<h3 className="font-semibold">権限</h3>
							<p>{invitation.role.name}</p>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						{session?.user ? (
							<AcceptInvitationButton token={token} />
						) : (
							<>
								<p className="text-sm text-muted-foreground text-center">
									招待を受け入れるにはログインが必要です
								</p>
								<LoginButton invitationToken={token} />
							</>
						)}
					</CardFooter>
				</Card>
			</div>
		);
	} catch (error) {
		return (
			<div className="container max-w-lg py-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-destructive">無効な招待リンク</CardTitle>
						<CardDescription>
							この招待リンクは無効であるか、有効期限が切れています
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}
}
