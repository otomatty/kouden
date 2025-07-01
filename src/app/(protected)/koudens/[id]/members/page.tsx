import { MemberView } from "./_components/member-view";
import { getMembers } from "@/app/_actions/members";
import { getKoudenRoles } from "@/app/_actions/roles";
import { checkKoudenPermission } from "@/app/_actions/permissions";
import { getCurrentUser } from "@/app/_actions/auth";

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

	// 現在のユーザー情報を取得
	const currentUser = await getCurrentUser();

	// メンバーとロール情報を取得
	const [members, roles] = await Promise.all([getMembers(koudenId), getKoudenRoles(koudenId)]);

	return (
		<div className="container mx-auto py-6 space-y-6 px-0 sm:px-6">
			<MemberView
				koudenId={koudenId}
				currentUserId={currentUser?.id}
				members={members}
				roles={roles}
				permission={permission}
			/>
		</div>
	);
}
