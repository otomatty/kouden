"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { RemoveMemberButton } from "./remove-member-button";
import type { PrimitiveAtom } from "jotai";
import type { MembersState } from "@/store/members";

interface ColumnsProps {
	permission: KoudenPermission;
	currentUserId?: string;
	membersAtom: PrimitiveAtom<MembersState>;
}

export const createColumns = ({
	permission,
	currentUserId,
	membersAtom,
}: ColumnsProps): ColumnDef<KoudenMember>[] => [
	{
		id: "member",
		header: "メンバー",
		cell: ({ row }) => {
			const member = row.original;
			return (
				<div className="flex items-center gap-2">
					<Avatar>
						<AvatarImage src={member.profile?.avatar_url || undefined} />
						<AvatarFallback>
							{getInitials(member.profile?.display_name || "")}
						</AvatarFallback>
					</Avatar>
					<span>{member.profile?.display_name}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "role",
		header: "ロール",
		cell: ({ row }) => {
			const member = row.original;

			if (!member.role) {
				return <Badge variant="outline">未設定</Badge>;
			}

			return <Badge variant="outline">{member.role.name}</Badge>;
		},
	},
	{
		id: "actions",
		header: "操作",
		cell: ({ row }) => {
			const member = row.original;

			// 自分自身かどうかを判定
			const isSelf = currentUserId === member.user_id;
			// オーナーかどうかを判定
			const isOwner = permission === "owner";
			// 削除/退出が可能かどうかを判定
			const canRemove = isOwner || isSelf;

			// オーナーは自分自身を削除できない
			if (isOwner && isSelf) {
				return null;
			}

			if (!canRemove) {
				return null;
			}

			return (
				<RemoveMemberButton
					member={member}
					isSelf={isSelf}
					membersAtom={membersAtom}
				/>
			);
		},
	},
];
