"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission } from "@/app/_actions/koudens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { removeMember } from "@/app/_actions/roles";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ColumnsProps {
	permission: KoudenPermission;
	currentUserId?: string;
}

export const createColumns = ({
	permission,
	currentUserId,
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
			const { toast } = useToast();
			const router = useRouter();

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

			const handleRemove = async () => {
				try {
					await removeMember(member.kouden_id, member.user_id);
					toast({
						title: isSelf ? "香典帳から退出しました" : "メンバーを削除しました",
					});
					router.refresh();
					// 自分自身が退出した場合は一覧ページにリダイレクト
					if (isSelf) {
						router.push("/koudens");
					}
				} catch (error) {
					toast({
						title: "エラー",
						description:
							error instanceof Error
								? error.message
								: isSelf
									? "退出に失敗しました"
									: "メンバーの削除に失敗しました",
						variant: "destructive",
					});
				}
			};

			if (!canRemove) {
				return null;
			}

			return (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleRemove}
					className={isSelf ? "text-red-500 hover:text-red-600" : ""}
				>
					{isSelf ? "退出する" : "削除"}
				</Button>
			);
		},
	},
];
