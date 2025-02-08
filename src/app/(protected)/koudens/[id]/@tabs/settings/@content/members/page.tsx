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

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">メンバー管理</h2>
				<p className="text-sm text-muted-foreground">香典帳のメンバーを管理します</p>
			</div>
			<MemberView koudenId={koudenId} />
		</div>
	);
}
