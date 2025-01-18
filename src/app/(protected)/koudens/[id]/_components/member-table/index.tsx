"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { getKoudenMembers } from "@/app/_actions/members";
import { getKoudenRoles } from "@/app/_actions/roles";
import { checkKoudenPermission } from "@/app/_actions/koudens";
import { userAtom } from "@/store/auth";
import { membersAtomFamily, isCacheValid } from "@/store/members";
import { ShareLinkForm } from "./share-link-form";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";

interface MemberTableProps {
	koudenId: string;
}

export function MemberTable({ koudenId }: MemberTableProps) {
	const membersAtom = membersAtomFamily(koudenId);
	const { members, roles, permission, isLoading, lastUpdated } =
		useAtomValue(membersAtom);
	const setMembersState = useSetAtom(membersAtom);
	const user = useAtomValue(userAtom);

	useEffect(() => {
		const loadData = async () => {
			// キャッシュが有効な場合はスキップ
			if (isCacheValid(lastUpdated)) {
				return;
			}

			try {
				setMembersState((prev) => ({ ...prev, isLoading: true }));
				const [membersData, rolesData, permissionData] = await Promise.all([
					getKoudenMembers(koudenId),
					getKoudenRoles(koudenId),
					checkKoudenPermission(koudenId),
				]);

				setMembersState({
					members: membersData,
					roles: rolesData,
					permission: permissionData,
					isLoading: false,
					lastUpdated: Date.now(),
				});
			} catch (error) {
				console.error("[ERROR] Failed to load data:", error);
				setMembersState((prev) => ({ ...prev, isLoading: false }));
			}
		};
		loadData();
	}, [koudenId, lastUpdated, setMembersState]);

	const canManageMembers = permission === "owner" || permission === "editor";
	const columns = createColumns({ permission, currentUserId: user?.id });

	return (
		<div className="space-y-4">
			{canManageMembers && (
				<div className="flex justify-end">
					<ShareLinkForm koudenId={koudenId} roles={roles} />
				</div>
			)}
			<DataTable columns={columns} data={members} isLoading={isLoading} />
		</div>
	);
}
