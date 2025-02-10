import { Suspense } from "react";
import { MemberView } from "./_components/member-view";
import { getMembers, getKoudenRoles } from "@/app/_actions/members";
import type { KoudenMember } from "@/types/member";
import { checkKoudenPermission } from "@/app/_actions/permissions";

interface MembersPageProps {
	params: Promise<{ id: string }>;
}

/**
 * メンバー管理ページ
 * - メンバー一覧の表示
 * - メンバーの追加・編集・削除機能
 * - ロールの管理
 */
export default async function MembersPage({ params }: MembersPageProps) {
	const { id: koudenId } = await params;

	const [members, roles, permission] = await Promise.all([
		getMembers(koudenId),
		getKoudenRoles(koudenId),
		checkKoudenPermission(koudenId),
	]);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">メンバー管理</h2>
				<p className="text-sm text-muted-foreground">香典帳のメンバーを管理します</p>
			</div>
			<Suspense fallback={<div>Loading...</div>}>
				<MemberView
					koudenId={koudenId}
					members={members as unknown as KoudenMember[]}
					roles={roles}
					permission={permission}
				/>
			</Suspense>
		</div>
	);
}
