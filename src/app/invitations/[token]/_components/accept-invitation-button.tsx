"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { acceptInvitation } from "@/app/_actions/invitations";
import { Loader2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

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
				variant: "default",
			});

			router.push("/koudens");
		} catch (error) {
			console.error("Error accepting invitation:", error);

			if (error instanceof Error) {
				switch (error.message) {
					case "認証が必要です":
						router.push(`/login?invitation_token=${token}`);
						return;
					case "招待が見つかりません":
					case "招待の有効期限が切れています":
					case "この招待は既に使用されています":
					case "招待の使用回数が上限に達しました":
						toast({
							title: "エラー",
							description: error.message,
							variant: "destructive",
						});
						router.refresh();
						return;
					case "すでにメンバーとして参加しています":
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
		<Button
			onClick={handleAccept}
			disabled={loading}
			className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300"
			size="lg"
		>
			<motion.span
				className="absolute inset-0 bg-gradient-to-r from-primary-foreground/10 to-transparent"
				initial={{ x: "100%" }}
				animate={{ x: loading ? "100%" : "0%" }}
				transition={{
					duration: 0.5,
					ease: "easeInOut",
				}}
			/>
			<motion.div
				className="flex items-center justify-center gap-2"
				initial={{ scale: 1 }}
				animate={{ scale: loading ? 0.95 : 1 }}
				transition={{ duration: 0.2 }}
			>
				{loading ? (
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
