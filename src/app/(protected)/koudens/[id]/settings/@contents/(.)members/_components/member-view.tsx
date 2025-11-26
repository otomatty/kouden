"use client";

import { membersAtom } from "@/store/members";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";
import type { KoudenPermission } from "@/types/role";
import { useSetAtom } from "jotai";
import { memo, useEffect, useRef, useState } from "react";
import { createColumns } from "./table/columns";
import { MembersTable } from "./table/data-table";

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
