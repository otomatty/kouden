"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { acceptInvitation } from "@/app/_actions/invitations";
import { InvitationError } from "@/types/error";

interface AcceptInvitationButtonProps {
	token: string;
}

export function AcceptInvitationButton({ token }: AcceptInvitationButtonProps) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();

	const handleAccept = async () => {
		try {
			setLoading(true);
			await acceptInvitation(token);

			toast({
				title: "参加しました",
				description: "香典帳のメンバーとして参加しました",
			});

			router.push("/koudens");
		} catch (error) {
			console.error("Error accepting invitation:", error);

			if (error instanceof InvitationError) {
				switch (error.code) {
					case "UNAUTHORIZED":
						router.push(`/login?invitation_token=${token}`);
						return;
					case "INVITATION_NOT_FOUND":
					case "INVITATION_EXPIRED":
					case "INVITATION_USED":
					case "MAX_USES_EXCEEDED":
						router.push(
							`/invitation-error?error=${encodeURIComponent(error.message)}`,
						);
						return;
					case "ALREADY_MEMBER":
						toast({
							title: "既に参加済み",
							description: error.message,
							variant: "default",
						});
						router.push("/koudens");
						return;
					default:
						toast({
							title: "エラー",
							description: error.message,
							variant: "destructive",
						});
				}
			} else {
				toast({
					title: "エラー",
					description: "予期せぬエラーが発生しました",
					variant: "destructive",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button onClick={handleAccept} disabled={loading} className="w-full">
			{loading ? "処理中..." : "参加する"}
		</Button>
	);
}
