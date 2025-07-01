"use client";

import React from "react";
import { MemberList } from "./member-list";
import { MemberEditDrawer } from "./member-edit-drawer";
import type { Member } from "./types";

interface MemberClientWrapperProps {
	members: Member[];
	koudenId: string;
	currentUserId?: string;
}

export function MemberClientWrapper({
	members,
	koudenId,
	currentUserId,
}: MemberClientWrapperProps) {
	const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

	const handleMemberClick = (member: Member) => {
		setSelectedMember(member);
		setIsDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setIsDrawerOpen(false);
		setSelectedMember(null);
	};

	return (
		<>
			<MemberList members={members} onMemberClick={handleMemberClick} />
			<MemberEditDrawer
				member={selectedMember}
				isOpen={isDrawerOpen}
				onClose={handleDrawerClose}
				koudenId={koudenId}
				currentUserId={currentUserId}
			/>
		</>
	);
}
