"use client";

import React from "react";
import { User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Member } from "./types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MemberListProps {
	members: Member[];
	onMemberClick?: (member: Member) => void;
}

export function MemberList({ members, onMemberClick }: MemberListProps) {
	const getRoleDisplayName = (roleName: string) => {
		const roleMap: Record<string, string> = {
			owner: "管理者",
			editor: "編集者",
			viewer: "閲覧者",
		};
		return roleMap[roleName] || "未設定";
	};

	const getRoleColor = (roleName: string) => {
		switch (roleName.toLowerCase()) {
			case "owner":
				return "text-purple-600 bg-purple-50";
			case "editor":
				return "text-blue-600 bg-blue-50";
			case "viewer":
				return "text-gray-600 bg-gray-50";
			default:
				return "text-gray-600 bg-gray-50";
		}
	};

	return (
		<ul className="divide-y divide-gray-200">
			{members.map((member) => (
				<button
					type="button"
					key={member.id}
					className={cn(
						"w-full flex items-center justify-between p-4",
						"hover:bg-gray-50 cursor-pointer",
					)}
					onClick={() => onMemberClick?.(member)}
				>
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10">
							{member.profile?.avatar_url ? (
								<AvatarImage
									src={member.profile.avatar_url}
									alt={member.profile?.display_name ?? ""}
								/>
							) : (
								<AvatarFallback>
									<User className="h-5 w-5 text-gray-500" />
								</AvatarFallback>
							)}
						</Avatar>
						<div>
							<p className="text-sm font-medium text-gray-900">
								{member.profile?.display_name ?? "名前未設定"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"px-2.5 py-0.5 rounded-full text-xs font-medium",
								getRoleColor(member.role.name),
							)}
						>
							{getRoleDisplayName(member.role.name)}
						</div>
						{member.canUpdateRole && <ChevronRight className="w-4 h-4 text-gray-500" />}
					</div>
				</button>
			))}
		</ul>
	);
}
