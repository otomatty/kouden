import { Suspense } from "react";
import { UserManagement } from "./_components/user-management";
import { UserManagementSkeleton } from "./_components/user-management-skeleton";

export default function AdminUsersPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">ユーザー管理</h1>
				<p className="text-muted-foreground mt-2">全ユーザーの管理と詳細情報の確認ができます</p>
			</div>

			<Suspense fallback={<UserManagementSkeleton />}>
				<UserManagement />
			</Suspense>
		</div>
	);
}
