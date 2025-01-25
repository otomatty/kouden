"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { removeMember } from "@/app/_actions/roles";
import type { KoudenMember } from "@/types/member";
import { type PrimitiveAtom, useSetAtom } from "jotai";
import type { MembersState } from "@/store/members";

interface RemoveMemberButtonProps {
	member: KoudenMember;
	isSelf: boolean;
	membersAtom: PrimitiveAtom<MembersState>;
}

export function RemoveMemberButton({
	member,
	isSelf,
	membersAtom,
}: RemoveMemberButtonProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const setMembersState = useSetAtom(membersAtom);

	const handleRemove = async () => {
		try {
			setIsLoading(true);
			await removeMember(member.kouden_id, member.user_id);

			// クライアントサイドで状態を更新
			setMembersState((prev) => ({
				...prev,
				members: prev.members.filter((m) => m.id !== member.id),
			}));

			toast({
				title: isSelf ? "香典帳から退出しました" : "メンバーを削除しました",
			});

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
		} finally {
			setIsLoading(false);
			setIsOpen(false);
		}
	};

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button
					variant="ghost"
					size="sm"
					className={isSelf ? "text-red-500 hover:text-red-600" : ""}
				>
					{isSelf ? "退出する" : "削除"}
				</Button>
			}
			title={isSelf ? "香典帳から退出" : "メンバーの削除"}
			description={
				isSelf
					? "この香典帳から退出してもよろしいですか？"
					: `${member.profile?.display_name || "このメンバー"}を削除してもよろしいですか？`
			}
		>
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
					<Avatar>
						<AvatarImage src={member.profile?.avatar_url || undefined} />
						<AvatarFallback>
							{getInitials(member.profile?.display_name || "")}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-medium">{member.profile?.display_name}</p>
						<p className="text-sm text-muted-foreground">{member.role?.name}</p>
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isLoading}
					>
						キャンセル
					</Button>
					<Button
						variant="destructive"
						onClick={handleRemove}
						disabled={isLoading}
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isSelf ? "退出する" : "削除する"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
}
