"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/_actions/invitations";
import { useToast } from "@/hooks/use-toast";

interface InvitationAcceptFormProps {
	token: string;
}

export function InvitationAcceptForm({ token }: InvitationAcceptFormProps) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();

	const handleAccept = async () => {
		setLoading(true);
		try {
			const { success, error } = await acceptInvitation({
				invitationToken: token,
			});

			if (error) {
				toast({
					title: "エラー",
					description: error,
					variant: "destructive",
				});
				return;
			}

			if (success) {
				toast({
					title: "成功",
					description: "招待を承認しました",
				});
				router.push("/koudens");
			}
		} catch (error) {
			toast({
				title: "エラー",
				description: "招待の承認に失敗しました",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex gap-4">
			<Button onClick={handleAccept} disabled={loading}>
				{loading ? "処理中..." : "招待を承認"}
			</Button>
			<Button
				variant="outline"
				onClick={() => router.push("/koudens")}
				disabled={loading}
			>
				キャンセル
			</Button>
		</div>
	);
}
