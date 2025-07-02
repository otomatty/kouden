import { MemberView } from "./_components/member-view";
import { getMembers } from "@/app/_actions/members";
import { getKoudenRoles } from "@/app/_actions/roles";
import type { KoudenMember } from "@/types/member";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { SettingsHeader } from "../../_components/settings-header";

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
		<div className="space-y-6">
			<SettingsHeader title="メンバー管理" description="香典帳のメンバーを管理します" />
			<MemberView
				koudenId={koudenId}
				members={members as unknown as KoudenMember[]}
				roles={roles}
				permission={permission}
			/>
		</div>
	);
}
