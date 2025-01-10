"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
	getKoudenMembers,
	updateMemberRole,
	removeMember,
} from "@/app/_actions/members";
import type { KoudenMember, MemberRole } from "@/types/sharing";
import { useToast } from "@/hooks/use-toast";

interface MemberListProps {
	koudenId: string;
}

export function MemberList({ koudenId }: MemberListProps) {
	const [members, setMembers] = useState<KoudenMember[]>([]);
	const [loading, setLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const fetchMembers = async () => {
			const { members: fetchedMembers, error } = await getKoudenMembers({
				koudenId,
			});
			if (error) {
				toast({
					title: "エラー",
					description: error,
					variant: "destructive",
				});
				return;
			}
			setMembers(fetchedMembers || []);
			setLoading(false);
		};

		fetchMembers();
	}, [koudenId, toast]);

	const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
		const { success, error } = await updateMemberRole({
			memberId,
			role: newRole,
		});

		if (error) {
			toast({
				title: "エラー",
				description: error,
				variant: "destructive",
			});
			return;
		}

		if (success) {
			setMembers((prev) =>
				prev.map((member) =>
					member.id === memberId ? { ...member, role: newRole } : member,
				),
			);
			toast({
				title: "成功",
				description: "メンバーの権限を更新しました",
			});
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		const { success, error } = await removeMember(memberId);

		if (error) {
			toast({
				title: "エラー",
				description: error,
				variant: "destructive",
			});
			return;
		}

		if (success) {
			setMembers((prev) => prev.filter((member) => member.id !== memberId));
			toast({
				title: "成功",
				description: "メンバーを削除しました",
			});
		}
	};

	if (loading) {
		return <div>読み込み中...</div>;
	}

	return (
		<div className="space-y-4">
			{members.length === 0 ? (
				<div className="text-center text-sm text-muted-foreground">
					メンバーはいません
				</div>
			) : (
				<div className="space-y-4">
					{members.map((member) => (
						<div
							key={member.id}
							className="flex items-center justify-between space-x-4"
						>
							<div className="flex items-center space-x-4">
								<Avatar>
									<AvatarImage src={member.profile?.avatar_url || undefined} />
									<AvatarFallback>
										{member.profile?.display_name?.[0] || "U"}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="text-sm font-medium">
										{member.profile?.display_name}
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Select
									value={member.role}
									onValueChange={(value: MemberRole) =>
										handleRoleChange(member.id, value)
									}
								>
									<SelectTrigger className="w-[100px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="viewer">閲覧者</SelectItem>
										<SelectItem value="editor">編集者</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleRemoveMember(member.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
