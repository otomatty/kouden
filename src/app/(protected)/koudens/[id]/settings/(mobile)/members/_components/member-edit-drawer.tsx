"use client";

import React from "react";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Member } from "./types";
import { updateMemberRole, deleteMember } from "@/app/_actions/members";

interface MemberEditDrawerProps {
	member: Member | null;
	isOpen: boolean;
	onClose: () => void;
	koudenId: string;
}

export function MemberEditDrawer({ member, isOpen, onClose, koudenId }: MemberEditDrawerProps) {
	const [isLoading, setIsLoading] = React.useState(false);

	const handleRoleChange = async (roleId: string) => {
		if (!member) return;

		try {
			setIsLoading(true);
			await updateMemberRole(member.id, roleId, koudenId);
			toast.success(`${member.profile?.display_name ?? "名前未設定"}のロールを変更しました`);
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("ロールの変更に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!member) return;

		if (
			!window.confirm(`${member.profile?.display_name ?? "名前未設定"}を削除してもよろしいですか？`)
		) {
			return;
		}

		try {
			setIsLoading(true);
			await deleteMember(member.id, koudenId);
			toast.success(`${member.profile?.display_name ?? "名前未設定"}を削除しました`);
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("メンバーの削除に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Drawer open={isOpen} onClose={onClose}>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{member?.profile?.display_name ?? "名前未設定"}の設定</DrawerTitle>
				</DrawerHeader>
				<div className="p-4 space-y-4">
					<div className="space-y-2">
						<Label>ロール</Label>
						<Select disabled={isLoading} value={member?.role.id} onValueChange={handleRoleChange}>
							<SelectTrigger>
								<SelectValue placeholder="ロールを選択" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="editor">編集者</SelectItem>
								<SelectItem value="viewer">閲覧者</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DrawerFooter>
					<Button variant="destructive" disabled={isLoading} onClick={handleDelete}>
						メンバーを削除
					</Button>
					<Button variant="outline" disabled={isLoading} onClick={onClose}>
						キャンセル
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
