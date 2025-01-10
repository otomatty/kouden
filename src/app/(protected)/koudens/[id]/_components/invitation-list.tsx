"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
	getKoudenInvitations,
	cancelInvitation,
} from "@/app/_actions/invitations";
import type { KoudenInvitation } from "@/types/sharing";
import { useToast } from "@/hooks/use-toast";

interface InvitationListProps {
	koudenId: string;
}

export function InvitationList({ koudenId }: InvitationListProps) {
	const [invitations, setInvitations] = useState<KoudenInvitation[]>([]);
	const [loading, setLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const fetchInvitations = async () => {
			const { invitations: fetchedInvitations, error } =
				await getKoudenInvitations({
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
			setInvitations(fetchedInvitations || []);
			setLoading(false);
		};

		fetchInvitations();
	}, [koudenId, toast]);

	const handleCancelInvitation = async (invitationId: string) => {
		const { success, error } = await cancelInvitation(invitationId);

		if (error) {
			toast({
				title: "エラー",
				description: error,
				variant: "destructive",
			});
			return;
		}

		if (success) {
			setInvitations((prev) =>
				prev.filter((invitation) => invitation.id !== invitationId),
			);
			toast({
				title: "成功",
				description: "招待をキャンセルしました",
			});
		}
	};

	if (loading) {
		return <div>読み込み中...</div>;
	}

	return (
		<div className="space-y-4">
			{invitations.length === 0 ? (
				<div className="text-center text-sm text-muted-foreground">
					招待中のユーザーはいません
				</div>
			) : (
				<div className="space-y-4">
					{invitations.map((invitation) => (
						<div
							key={invitation.id}
							className="flex items-center justify-between space-x-4"
						>
							<div>
								<div className="text-sm font-medium">{invitation.email}</div>
								<div className="text-xs text-muted-foreground">
									{invitation.role === "editor" ? "編集者" : "閲覧者"}
									として招待中
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleCancelInvitation(invitation.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
