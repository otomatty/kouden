import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { MemberView } from "@/app/(protected)/koudens/[id]/members/_components/member-view";
import { getMembersForAdmin } from "@/app/_actions/members";
import { getKoudenRolesForAdmin } from "@/app/_actions/roles";

interface AdminMembersPageProps {
	params: Promise<{ id: string }>;
}

export default async function AdminMembersPage({ params }: AdminMembersPageProps) {
	const { id: koudenId } = await params;

	// 管理者権限チェック
	await checkAdminPermission();

	// 管理者用の権限オブジェクト（閲覧権限のみ）
	const adminPermission = "viewer" as const;

	// メンバーとロール情報を取得（管理者用関数を使用）
	const [membersResult, rolesResult] = await Promise.all([
		getMembersForAdmin(koudenId),
		getKoudenRolesForAdmin(koudenId),
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
		<div className="container mx-auto py-6 space-y-6">
			<MemberView
				koudenId={koudenId}
				members={members}
				roles={roles}
				permission={adminPermission}
			/>
		</div>
	);
}
