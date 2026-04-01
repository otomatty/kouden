"use client";

import { useSetAtom } from "jotai";
import { memo, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { membersAtom } from "@/store/members";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission, KoudenRole } from "@/types/role";
import { MobileMemberList } from "./mobile-member-list";
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
	const isMobile = useIsMobile();

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
			} catch (_error) {
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
		<div className="space-y-4">
			{/* メイン表示 */}
			{isMobile ? (
				<MobileMemberList
					members={members}
					roles={roles}
					permission={permission}
					koudenId={koudenId}
					currentUserId={currentUserId}
					membersAtom={membersAtom}
				/>
			) : (
				<MembersTable
					columns={columns}
					data={members}
					permission={permission}
					koudenId={koudenId}
					roles={roles}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
}

export const MemberView = memo(MemberViewComponent);
