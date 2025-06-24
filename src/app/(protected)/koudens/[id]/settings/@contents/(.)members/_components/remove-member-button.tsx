"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { removeMember } from "@/app/_actions/roles";
import type { KoudenMember } from "@/types/member";
import { type PrimitiveAtom, useSetAtom } from "jotai";

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
	};
	return roleMap[roleName] || "未設定";
};

interface RemoveMemberButtonProps {
	member: KoudenMember;
	isSelf: boolean;
	membersAtom: PrimitiveAtom<KoudenMember[]>;
}

export function RemoveMemberButton({ member, isSelf, membersAtom }: RemoveMemberButtonProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [, setIsOpen] = useState(false);
	const setMembersState = useSetAtom(membersAtom);
	const isOwner = member.role?.name === "owner";

	const handleRemove = async () => {
		try {
			setIsLoading(true);
			await removeMember(member.kouden_id, member.user_id);

			// クライアントサイドで状態を更新
			setMembersState((prev) => prev.filter((m) => m.id !== member.id));

			toast.success(isSelf ? "香典帳から退出しました" : "メンバーを削除しました");

			// 自分自身が退出した場合は一覧ページにリダイレクト
			if (isSelf) {
				router.push("/koudens");
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: isSelf
						? "退出に失敗しました"
						: "メンバーの削除に失敗しました",
				{ description: "しばらく時間をおいてから再度お試しください" },
			);
		} finally {
			setIsLoading(false);
			setIsOpen(false);
		}
	};

	// 管理者は削除できない
	if (isOwner) {
		return null;
	}

	return (
		<ResponsiveDialog
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
						<AvatarFallback>{getInitials(member.profile?.display_name || "")}</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-medium">{member.profile?.display_name}</p>
						<p className="text-sm text-muted-foreground">
							{getRoleDisplayName(member.role?.name || "")}
						</p>
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
						キャンセル
					</Button>
					<Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isSelf ? "退出する" : "削除する"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
}
