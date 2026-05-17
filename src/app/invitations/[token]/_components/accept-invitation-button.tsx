"use client";

import { acceptInvitation } from "@/app/_actions/invitations";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface AcceptInvitationButtonProps {
	token: string;
}

export function AcceptInvitationButton({ token }: AcceptInvitationButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleAccept = async () => {
		try {
			setIsLoading(true);
			// `acceptInvitation` は ActionResult を返すため、`ok: false` を
			// 成功と取り違えないよう明示的に分岐する。
			const result = await acceptInvitation(token);
			if (!result.ok) {
				const { code, message } = result.error;
				if (code === "UNAUTHORIZED") {
					router.push(`/auth/login?invitation_token=${token}`);
					return;
				}
				if (code === "ALREADY_EXISTS") {
					toast.info(message);
					router.push("/koudens");
					return;
				}
				toast.error(message);
				router.refresh();
				return;
			}

			toast.success("参加しました", {
				description: "香典帳のメンバーとして参加しました",
			});

			router.push("/koudens");
		} catch (error) {
			console.error("[DEBUG] Error accepting invitation:", error);
			toast.error("予期せぬエラーが発生しました", {
				description: "しばらく時間をおいてから再度お試しください",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			onClick={handleAccept}
			disabled={isLoading}
			className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
			size="lg"
		>
			<motion.span
				className="absolute inset-0 bg-gradient-to-r from-primary-foreground/10 to-transparent"
				initial={{ x: "100%" }}
				animate={{ x: isLoading ? "100%" : "0%" }}
				transition={{
					duration: 0.5,
					ease: "easeInOut",
				}}
			/>
			<motion.div
				className="flex items-center justify-center gap-2"
				initial={{ scale: 1 }}
				animate={{ scale: isLoading ? 0.95 : 1 }}
				transition={{ duration: 0.2 }}
			>
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						参加処理中...
					</>
				) : (
					<>
						<UserPlus className="mr-2 h-5 w-5" />
						参加する
					</>
				)}
			</motion.div>
		</Button>
	);
}
