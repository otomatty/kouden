import React from "react";
import { BackLink } from "@/components/custom/BackLink";
import { MemberClientWrapper } from "./_components/member-client-wrapper";
import { getMembers } from "@/app/_actions/members";

interface MembersPageProps {
	params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
	const { id } = await params;
	const members = await getMembers(id);

	return (
		<div className="mx-auto py-4 space-y-4">
			<BackLink href={`/koudens/${id}/settings`} />
			<div>
				<h2 className="text-2xl font-bold tracking-tight">メンバー設定</h2>
				<p className="text-sm text-muted-foreground">メンバーの管理と権限の設定を行います</p>
			</div>

			<div className="bg-white">
				<MemberClientWrapper members={members} koudenId={id} />
			</div>
		</div>
	);
}
