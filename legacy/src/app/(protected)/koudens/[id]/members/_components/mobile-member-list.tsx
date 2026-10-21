import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ChevronRight } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { ShareLinkForm } from "./share-link-dialog";
import { InviteByEmailDialog } from "./invite-by-email-dialog";
import { MemberDetailDrawer } from "./member-detail-drawer";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole, KoudenPermission } from "@/types/role";
import type { PrimitiveAtom } from "jotai";

interface MobileMemberListProps {
	members: KoudenMember[];
	roles: KoudenRole[];
	permission: KoudenPermission;
	koudenId: string;
	currentUserId?: string;
	membersAtom: PrimitiveAtom<KoudenMember[]>;
}

const getRoleDisplayName = (roleName: string) => {
	const roleMap: Record<string, string> = {
		owner: "管理者",
		editor: "編集者",
		viewer: "閲覧者",
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

export function MobileMemberList({
	members,
	roles,
	permission,
	koudenId,
	currentUserId,
	membersAtom,
}: MobileMemberListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");

	// フィルタリング
	const filteredMembers = members.filter((member) => {
		const nameMatch = member.profile?.display_name
			?.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const roleMatch = roleFilter === "all" || member.role?.name === roleFilter;
		return nameMatch && roleMatch;
	});

	return (
		<div className="space-y-4">
			{/* ヘッダーアクション */}
			<div className="flex flex-col space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						<h2 className="text-lg font-semibold">メンバー</h2>
						<Badge variant="secondary">{members.length}名</Badge>
					</div>
				</div>

				{/* 検索とフィルター */}
				<div className="space-y-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="メンバー名で検索..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger>
							<SelectValue placeholder="ロールで絞り込み" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">すべてのロール</SelectItem>
							<SelectItem value="owner">管理者</SelectItem>
							<SelectItem value="editor">編集者</SelectItem>
							<SelectItem value="viewer">閲覧者</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* 招待ボタン */}
				{permission === "owner" && (
					<div className="space-y-2">
						<ShareLinkForm koudenId={koudenId} roles={roles} />
						<InviteByEmailDialog koudenId={koudenId} roles={roles} />
					</div>
				)}
			</div>

			{/* メンバーカード */}
			<div className="space-y-3">
				{filteredMembers.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center">
							<p className="text-muted-foreground">
								{searchTerm || roleFilter !== "all"
									? "条件に合うメンバーが見つかりません"
									: "メンバーがいません"}
							</p>
						</CardContent>
					</Card>
				) : (
					filteredMembers.map((member) => {
						const isSelf = currentUserId === member.user_id;

						return (
							<MemberDetailDrawer
								key={member.id}
								member={member}
								roles={roles}
								permission={permission}
								koudenId={koudenId}
								currentUserId={currentUserId}
								membersAtom={membersAtom}
								trigger={
									<Card className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors">
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3 flex-1">
													<Avatar className="h-12 w-12">
														<AvatarImage src={member.profile?.avatar_url || undefined} />
														<AvatarFallback className="text-sm">
															{getInitials(member.profile?.display_name || "")}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<h3 className="font-medium text-base truncate">
																{member.profile?.display_name}
															</h3>
															{isSelf && (
																<Badge variant="outline" className="text-xs px-2 py-0">
																	あなた
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-2">
															{member.role ? (
																<Badge
																	variant={getRoleVariant(member.role.name)}
																	className="text-sm"
																>
																	{getRoleDisplayName(member.role.name)}
																</Badge>
															) : (
																<Badge variant="outline" className="text-sm">
																	未設定
																</Badge>
															)}
														</div>
													</div>
												</div>
												<ChevronRight className="h-5 w-5 text-muted-foreground" />
											</div>
										</CardContent>
									</Card>
								}
							/>
						);
					})
				)}
			</div>
		</div>
	);
}
