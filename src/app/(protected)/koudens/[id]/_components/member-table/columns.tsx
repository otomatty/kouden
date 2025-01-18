"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { KoudenMember } from "@/types/member";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { removeMember } from "@/app/_actions/roles";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export const columns: ColumnDef<KoudenMember>[] = [
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

			const handleRemove = async () => {
				try {
					await removeMember(member.kouden_id, member.user_id);
					toast({
						title: "メンバーを削除しました",
					});
					router.refresh();
				} catch (error) {
					toast({
						title: "エラー",
						description:
							error instanceof Error
								? error.message
								: "メンバーの削除に失敗しました",
						variant: "destructive",
					});
				}
			};

			return (
				<Button variant="ghost" size="sm" onClick={handleRemove}>
					削除
				</Button>
			);
		},
	},
];
