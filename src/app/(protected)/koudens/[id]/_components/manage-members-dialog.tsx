"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberList } from "./member-list";
import { InviteMemberForm } from "./invite-member-form";
import { InvitationList } from "./invitation-list";
import { Users } from "lucide-react";

interface ManageMembersDialogProps {
	koudenId: string;
}

export function ManageMembersDialog({ koudenId }: ManageMembersDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Users className="mr-2 h-4 w-4" />
					メンバー管理
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>メンバー管理</DialogTitle>
					<DialogDescription>
						香典帳のメンバーを管理します。メンバーの追加、権限の変更、削除ができます。
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue="members" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="members">メンバー</TabsTrigger>
						<TabsTrigger value="invitations">招待中</TabsTrigger>
						<TabsTrigger value="invite">招待</TabsTrigger>
					</TabsList>
					<TabsContent value="members">
						<MemberList koudenId={koudenId} />
					</TabsContent>
					<TabsContent value="invitations">
						<InvitationList koudenId={koudenId} />
					</TabsContent>
					<TabsContent value="invite">
						<InviteMemberForm koudenId={koudenId} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
