import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { getInvitation } from "@/app/_actions/invitations";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { AnimatedInvitationCard } from "./_components/animated-invitation-card";

interface InvitationPageProps {
	params: Promise<{
		token: string;
	}>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
	title: "招待 | 香典帳",
	description: "香典帳の招待ページです",
};

export default async function InvitationPage({ params }: InvitationPageProps) {
	const { token } = await params;
	try {
		const invitation = await getInvitation(token);
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!invitation) {
			notFound();
		}

		const expiresIn = formatDistanceToNow(new Date(invitation.expires_at), {
			locale: ja,
			addSuffix: true,
		});

		return (
			<div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-8 px-4 sm:px-6 lg:px-8">
				<AnimatedInvitationCard
					title={invitation.kouden_data?.title ?? "不明"}
					description={invitation.kouden_data?.description}
					creatorName={invitation.creator?.display_name ?? "不明"}
					expiresIn={expiresIn}
					maxUses={invitation.max_uses ?? undefined}
					usedCount={invitation.used_count ?? undefined}
					userEmail={user?.email ?? undefined}
					token={token}
					isLoggedIn={!!user}
					isExistingMember={invitation.isExistingMember}
				/>
			</div>
		);
	} catch {
		return (
			<div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-8 px-4 sm:px-6 lg:px-8">
				<AnimatedInvitationCard
					title="不明"
					creatorName="不明"
					expiresIn=""
					token={token}
					isLoggedIn={false}
					isError={true}
					errorTitle="無効な招待リンク"
					errorDescription="この招待リンクは無効であるか、有効期限が切れています"
				/>
			</div>
		);
	}
}
