"use client";

import { useEffect, useRef, memo, useState } from "react";
import { useSetAtom } from "jotai";
import { membersAtom } from "@/store/members";
import { MembersTable } from "./table/data-table";
import { createColumns } from "./table/columns";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";
import type { KoudenPermission } from "@/types/role";

interface MemberViewProps {
	koudenId: string;
	currentUserId?: string;
	members: KoudenMember[];
	roles: KoudenRole[];
	permission: KoudenPermission;
}

function MemberViewComponent({
	koudenId,
	currentUserId,
	members,
	roles,
	permission,
}: MemberViewProps) {
	const setMembers = useSetAtom(membersAtom);
	const [isLoading, setIsLoading] = useState(true);
	const [isDataReady, setIsDataReady] = useState(false);
	const previousMembersRef = useRef<KoudenMember[]>(members);

	// データの初期化と準備
	useEffect(() => {
		const initializeData = async () => {
			try {
				setIsLoading(true);
				if (members !== previousMembersRef.current) {
					setMembers(members);
					previousMembersRef.current = members;
				}
				setIsDataReady(true);
			} catch (error) {
				console.error("[MemberView] Data initialization error:", error);
			} finally {
				setIsLoading(false);
			}
		};

		initializeData();
	}, [members, setMembers]);

	const columns = createColumns({
		permission,
		currentUserId,
		membersAtom,
		koudenId,
		roles,
	});

	if (!isDataReady) {
		return null;
	}

	return (
		<MembersTable
			columns={columns}
			data={members}
			permission={permission}
			koudenId={koudenId}
			roles={roles}
			isLoading={isLoading}
		/>
	);
}

export const MemberView = memo(MemberViewComponent);
