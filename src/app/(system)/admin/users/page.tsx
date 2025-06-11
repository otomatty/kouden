import { Suspense } from "react";
import {
	getAdminUsers,
	addAdminUser,
	updateAdminRole,
	removeAdminUser,
	findUserByEmail,
} from "@/app/_actions/admin/admin-users";
import { AdminUsersTable } from "./_components/admin-users-table";
import { AddAdminButton } from "./_components/add-admin-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser } from "@/types/admin";

export default async function AdminUsersPage() {
	const adminUsers = await getAdminUsers();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">管理者一覧</h1>
				{/* <AddAdminButton
					findUserByEmail={findUserByEmail}
					addAdminUser={addAdminUser}
				/> */}
			</div>
			<Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
				<AdminUsersTable
					adminUsers={adminUsers as AdminUser[]}
					updateAdminRole={updateAdminRole}
					removeAdminUser={removeAdminUser}
				/>
			</Suspense>
		</div>
	);
}
