"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { membersAtom } from "@/store/members";
import { MembersTable } from "./data-table";
import { createColumns } from "./columns";
import { getKoudenMembers, getKoudenRoles } from "@/app/_actions/members";
import { useQuery } from "@tanstack/react-query";
import type { KoudenPermission } from "@/types/role";

interface MemberViewProps {
	koudenId: string;
	currentUserId?: string;
	permission: KoudenPermission;
}

export function MemberView({
	koudenId,
	currentUserId,
	permission,
}: MemberViewProps) {
	const [members, setMembers] = useAtom(membersAtom);

	// メンバー一覧の取得
	const {
		data: fetchedMembers,
		isLoading: isMembersLoading,
		error: membersError,
	} = useQuery({
		queryKey: ["members", koudenId],
		queryFn: () => getKoudenMembers(koudenId),
	});

	// ロール一覧の取得
	const {
		data: roles = [],
		isLoading: isRolesLoading,
		error: rolesError,
	} = useQuery({
		queryKey: ["roles", koudenId],
		queryFn: () => getKoudenRoles(koudenId),
	});

	useEffect(() => {
		if (fetchedMembers) {
			setMembers(fetchedMembers);
		}
	}, [fetchedMembers, setMembers]);

	if (membersError || rolesError) {
		return (
			<div className="text-center text-destructive">
				エラーが発生しました。再度お試しください。
			</div>
		);
	}

	const columns = createColumns({
		permission,
		currentUserId,
		membersAtom,
		koudenId,
		roles,
	});

	return (
		<>
			<MembersTable
				columns={columns}
				data={members}
				permission={permission}
				koudenId={koudenId}
				roles={roles}
				isLoading={isMembersLoading || isRolesLoading}
			/>
		</>
	);
}
