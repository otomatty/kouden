"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailInviteForm } from "./email-invite-form";
import { ShareLinkForm } from "./member-table/share-link-form";
import { RoleSelect } from "@/components/custom/role-select";

interface InviteDialogProps {
	koudenId: string;
}

export function InviteDialog({ koudenId }: InviteDialogProps) {
	const [selectedRole, setSelectedRole] = useState<string>("");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>メンバーを招待</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>メンバーを招待</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<RoleSelect
						koudenId={koudenId}
						value={selectedRole}
						onValueChange={setSelectedRole}
					/>
				</div>
				<Tabs defaultValue="email" className="mt-4">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="email">メールで招待</TabsTrigger>
						<TabsTrigger value="link">リンクを共有</TabsTrigger>
					</TabsList>
					<TabsContent value="email">
						<EmailInviteForm koudenId={koudenId} roleId={selectedRole} />
					</TabsContent>
					<TabsContent value="link">
						<ShareLinkForm koudenId={koudenId} roleId={selectedRole} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
