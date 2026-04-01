"use client";

import type { PrimitiveAtom } from "jotai";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { updateMemberRole } from "@/app/_actions/roles";
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
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import type { KoudenMember } from "@/types/member";
import type { KoudenPermission, KoudenRole } from "@/types/role";
import { RemoveMemberButton } from "./remove-member-button";

interface MemberDetailDrawerProps {
	member: KoudenMember;
	roles: KoudenRole[];
	permission: KoudenPermission;
	koudenId: string;
	currentUserId?: string;
	membersAtom: PrimitiveAtom<KoudenMember[]>;
	trigger: React.ReactNode;
}

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
		// 🐛 問題のある値への対応
		unknown: "権限エラー",
	};

	const result = roleMap[roleName] || "未設定";

	// 🚨 予期しないロール名をアラートで報告
	if (!["owner", "editor", "viewer"].includes(roleName)) {
		console.warn(`🚨 予期しないロール名: "${roleName}"`);
	}

	return result;
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

export function MemberDetailDrawer({
	member,
	roles,
	permission,
	koudenId,
	currentUserId,
	membersAtom,
	trigger,
}: MemberDetailDrawerProps) {
	const [open, setOpen] = useState(false);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);
	const isSelf = currentUserId === member.user_id;
	const isOwner = member.role?.name === "owner";
	const canChangeRole = permission === "owner" && !isSelf && !isOwner;
	const canRemove = (permission === "owner" || isSelf) && !isOwner;

	const handleRoleChange = async (roleId: string) => {
		try {
			setIsUpdatingRole(true);
			await updateMemberRole(koudenId, member.user_id, roleId);
			toast.success("ロールを更新しました", {
				description: "メンバーのロールが正常に変更されました",
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "ロールの更新に失敗しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsUpdatingRole(false);
		}
	};

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{trigger}</DrawerTrigger>
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
								<h3 className="text-xl font-semibold">{member.profile?.display_name}</h3>
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
									{roles
										.filter((role) => role.name !== "owner")
										.map((role) => {
											const isSelected = member.role?.id === role.id;
											return (
												<button
													key={role.id}
													type="button"
													onClick={() => handleRoleChange(role.id)}
													disabled={isUpdatingRole}
													className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
														isSelected
															? "border-primary bg-primary/5"
															: "border-border hover:border-primary/50 hover:bg-muted/50"
													} ${isUpdatingRole ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
					{canRemove && (
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
								<RemoveMemberButton
									member={member}
									isSelf={isSelf}
									membersAtom={membersAtom}
									variant="standalone"
								/>
							</div>
						</>
					)}
				</div>

				<DrawerFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						閉じる
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
