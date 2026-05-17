import { getMembers } from "@/app/_actions/members";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { getKoudenRoles } from "@/app/_actions/roles";
import { SettingsHeader } from "../../_components/settings-header";
import { MemberView } from "./_components/member-view";

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

	const [membersResult, rolesResult, permission] = await Promise.all([
		getMembers(koudenId),
		getKoudenRoles(koudenId),
		checkKoudenPermission(koudenId),
	]);
	if (!membersResult.ok) {
		throw new Error(membersResult.error.message);
	}
	if (!rolesResult.ok) {
		throw new Error(rolesResult.error.message);
	}
	const members = membersResult.data;
	const roles = rolesResult.data;

	return (
		<div className="space-y-6">
			<SettingsHeader title="メンバー管理" description="香典帳のメンバーを管理します" />
			<MemberView koudenId={koudenId} members={members} roles={roles} permission={permission} />
		</div>
	);
}
