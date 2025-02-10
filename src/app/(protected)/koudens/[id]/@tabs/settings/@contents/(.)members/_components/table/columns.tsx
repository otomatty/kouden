"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission } from "@/types/role";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { RemoveMemberButton } from "../remove-member-button";
import type { PrimitiveAtom } from "jotai";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { updateMemberRole } from "@/app/_actions/members";
import { useToast } from "@/hooks/use-toast";
import type { KoudenRole } from "@/types/role";

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
	};
	return roleMap[roleName] || "未設定";
};

interface CreateColumnsOptions {
	permission: KoudenPermission;
	currentUserId?: string;
	membersAtom: PrimitiveAtom<KoudenMember[]>;
	koudenId: string;
	roles: KoudenRole[];
}

export const createColumns = ({
	permission,
	currentUserId,
	membersAtom,
	koudenId,
	roles,
}: CreateColumnsOptions): ColumnDef<KoudenMember>[] => {
	const { toast } = useToast();

	const handleRoleChange = async (userId: string, roleId: string) => {
		try {
			await updateMemberRole(koudenId, userId, roleId);
			toast({
				title: "ロールを更新しました",
			});
		} catch (error) {
			toast({
				title: "エラー",
				description: error instanceof Error ? error.message : "ロールの更新に失敗しました",
				variant: "destructive",
			});
		}
	};

	return [
		{
			id: "member",
			header: "メンバー",
			cell: ({ row }) => {
				const member = row.original;
				return (
					<div className="flex items-center gap-2">
						<Avatar>
							<AvatarImage src={member.profile?.avatar_url || undefined} />
							<AvatarFallback>{getInitials(member.profile?.display_name || "")}</AvatarFallback>
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
				const isOwner = permission === "owner";
				const isSelf = currentUserId === member.user_id;

				if (!member.role) {
					return <Badge variant="outline">未設定</Badge>;
				}

				// 管理者の場合は編集不可
				if (member.role.name === "owner") {
					return <Badge variant="outline">{getRoleDisplayName("owner")}</Badge>;
				}

				// 管理者のみがロールを変更可能
				if (isOwner && !isSelf) {
					return (
						<Select
							defaultValue={member.role.id}
							onValueChange={(value) => handleRoleChange(member.user_id, value)}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{roles
									.filter((role) => role.name !== "owner")
									.map((role) => (
										<SelectItem key={role.id} value={role.id}>
											{getRoleDisplayName(role.name)}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					);
				}

				return <Badge variant="outline">{getRoleDisplayName(member.role.name)}</Badge>;
			},
		},
		{
			id: "actions",
			header: "操作",
			cell: ({ row }) => {
				const member = row.original;
				const isSelf = currentUserId === member.user_id;
				const isOwner = member.role?.name === "owner";

				if (isOwner && isSelf) {
					return null;
				}

				const canRemove = permission === "owner" || isSelf;
				if (!canRemove) {
					return null;
				}

				return <RemoveMemberButton member={member} isSelf={isSelf} membersAtom={membersAtom} />;
			},
		},
	];
};

// カラムラベルの定義
export const columnLabels: Record<string, string> = {
	member: "メンバー",
	role: "ロール",
	actions: "操作",
};

// 検索オプションの定義
export const searchOptions = [
	{ value: "member", label: "メンバー名" },
	{ value: "role", label: "ロール" },
];

// ソートオプションの定義
export const sortOptions = [
	{ value: "member_asc", label: "メンバー名順" },
	{ value: "role_asc", label: "ロール順" },
];

// 画面サイズに応じた列の表示設定
export const defaultColumnVisibility = {
	actions: true,
};

export const tabletColumnVisibility = {
	...defaultColumnVisibility,
};
