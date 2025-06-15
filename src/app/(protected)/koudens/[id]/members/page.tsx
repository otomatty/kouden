import { MemberView } from "./_components/member-view";
import { getMembers, getKoudenRoles } from "@/app/_actions/members";
import { checkKoudenPermission } from "@/app/_actions/permissions";

interface MembersPageProps {
	params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
	const { id: koudenId } = await params;

	// 権限チェック
	const permission = await checkKoudenPermission(koudenId);
	if (!permission) {
		throw new Error("アクセス権限がありません");
	}

	// メンバーとロール情報を取得
	const [members, roles] = await Promise.all([getMembers(koudenId), getKoudenRoles(koudenId)]);

	return (
		<div className="container mx-auto py-6 space-y-6">
			<MemberView koudenId={koudenId} members={members} roles={roles} permission={permission} />
		</div>
	);
}
