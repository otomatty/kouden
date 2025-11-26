"use client";

import { removeMember as deleteMember, leaveMember, updateMemberRole } from "@/app/_actions/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import React, { useState } from "react";
import { toast } from "sonner";
import type { Member } from "./types";

interface MemberEditDrawerProps {
	member: Member | null;
	isOpen: boolean;
	onClose: () => void;
	koudenId: string;
	currentUserId?: string;
}

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
		unknown: "権限エラー",
	};
	return roleMap[roleName] || "未設定";
};

const getRoleVariant = (roleName: string) => {
	switch (roleName) {
		case "owner":
			return "default";
		case "editor":
			return "secondary";
		case "viewer":
			return "outline";
		default:
			return "outline";
	}
};

const getRoleDescription = (roleName: string) => {
	const roleDescriptionMap: Record<string, string> = {
		owner: "すべての操作が可能です。香典帳の削除や他のメンバーの管理ができます。",
		editor: "香典の記録・編集・削除が可能です。メンバーの管理はできません。",
		viewer: "香典の閲覧のみ可能です。記録の編集はできません。",
	};
	return roleDescriptionMap[roleName] || "権限が設定されていません。";
};

// 利用可能なロール（固定）
const availableRoles = [
	{ id: "editor", name: "editor" },
	{ id: "viewer", name: "viewer" },
];

export function MemberEditDrawer({
	member,
	isOpen,
	onClose,
	koudenId,
	currentUserId,
}: MemberEditDrawerProps) {
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	if (!member) return null;

	const isSelf = currentUserId === member.user_id;
	const isOwner = member.role?.name === "owner";
	const canChangeRole = !(isSelf || isOwner);
	const canDelete = !isOwner;

	const handleRoleChange = async (roleId: string) => {
		try {
			setIsUpdatingRole(true);
			await updateMemberRole(koudenId, member.user_id, roleId);
			toast.success("ロールを更新しました", {
				description: "メンバーのロールが正常に変更されました",
			});
			onClose();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "ロールの更新に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsUpdatingRole(false);
		}
	};

	const handleDelete = async () => {
		if (
			!window.confirm(
				`${member.profile?.display_name ?? "名前未設定"}を${isSelf ? "退出" : "削除"}してもよろしいですか？`,
			)
		) {
			return;
		}

		try {
			setIsDeleting(true);

			if (isSelf) {
				// 自分自身の場合は leaveMember を使用
				await leaveMember(koudenId);
			} else {
				// 他のメンバーの場合は deleteMember を使用
				await deleteMember(koudenId, member.user_id);
			}

			toast.success(
				`${member.profile?.display_name ?? "名前未設定"}を${isSelf ? "退出" : "削除"}しました`,
			);
			onClose();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `メンバーの${isSelf ? "退出" : "削除"}に失敗しました`,
				{
					description: "しばらく時間をおいてから再度お試しください",
				},
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>メンバー詳細</DrawerTitle>
					<DrawerDescription>メンバーの情報と権限を確認・変更できます</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 pb-6 space-y-6">
					{/* メンバー基本情報 */}
					<div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
						<Avatar className="h-16 w-16">
							<AvatarImage src={member.profile?.avatar_url || undefined} />
							<AvatarFallback className="text-lg">
								{getInitials(member.profile?.display_name || "")}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="text-xl font-semibold">
									{member.profile?.display_name ?? "名前未設定"}
								</h3>
								{isSelf && (
									<Badge variant="outline" className="text-xs">
										あなた
									</Badge>
								)}
							</div>
						</div>
					</div>

					<Separator />

					{/* 権限情報 */}
					<div className="space-y-4">
						<div>
							<Label className="text-base font-medium">現在の権限</Label>
							<div className="mt-2 space-y-2">
								<div className="flex items-center gap-2">
									{member.role ? (
										<Badge variant={getRoleVariant(member.role.name)} className="text-sm">
											{getRoleDisplayName(member.role.name)}
										</Badge>
									) : (
										<Badge variant="outline" className="text-sm">
											未設定
										</Badge>
									)}
								</div>
								<p className="text-sm text-muted-foreground">
									{member.role
										? getRoleDescription(member.role.name)
										: "権限が設定されていません。"}
								</p>
							</div>
						</div>

						{/* ロール変更 */}
						{canChangeRole && (
							<div className="space-y-3">
								<Label className="text-base font-medium">権限を変更</Label>
								{isUpdatingRole && (
									<p className="text-xs text-muted-foreground">権限を更新しています...</p>
								)}
								<div className="space-y-2">
									{availableRoles.map((role) => {
										const isSelected = member.role?.name === role.name;
										return (
											<button
												key={role.id}
												type="button"
												onClick={() => handleRoleChange(role.id)}
												disabled={isUpdatingRole || isDeleting}
												className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
													isSelected
														? "border-primary bg-primary/5"
														: "border-border hover:border-primary/50 hover:bg-muted/50"
												} ${
													isUpdatingRole || isDeleting
														? "opacity-50 cursor-not-allowed"
														: "cursor-pointer"
												}`}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-1">
															<Badge variant={getRoleVariant(role.name)} className="text-sm">
																{getRoleDisplayName(role.name)}
															</Badge>
															{isSelected && <div className="w-2 h-2 bg-primary rounded-full" />}
														</div>
														<p className="text-sm text-muted-foreground">
															{getRoleDescription(role.name)}
														</p>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* 削除・退出アクション */}
					{canDelete && (
						<>
							<Separator />
							<div className="space-y-3">
								<Label className="text-base font-medium text-destructive">
									{isSelf ? "香典帳から退出" : "メンバーを削除"}
								</Label>
								<p className="text-sm text-muted-foreground">
									{isSelf
										? "この香典帳から退出すると、今後この香典帳にアクセスできなくなります。"
										: "このメンバーを削除すると、今後この香典帳にアクセスできなくなります。"}
								</p>
								<Button
									variant="destructive"
									disabled={isUpdatingRole || isDeleting}
									onClick={handleDelete}
									className="w-full"
								>
									{isDeleting
										? `${isSelf ? "退出" : "削除"}しています...`
										: `メンバーを${isSelf ? "退出" : "削除"}`}
								</Button>
							</div>
						</>
					)}
				</div>

				<DrawerFooter>
					<Button variant="outline" onClick={onClose} disabled={isUpdatingRole || isDeleting}>
						閉じる
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
