"use client";

import { motion } from "framer-motion";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Users, Info } from "lucide-react";
import { AcceptInvitationButton } from "./accept-invitation-button";
import { LoginButton } from "@/components/custom/login-button";

interface AnimatedInvitationCardProps {
	title: string;
	description?: string;
	creatorName: string;
	expiresIn: string;
	maxUses?: number;
	usedCount?: number;
	userEmail?: string;
	token: string;
	isLoggedIn: boolean;
	isError?: boolean;
	errorTitle?: string;
	errorDescription?: string;
}

export function AnimatedInvitationCard({
	title,
	description,
	creatorName,
	expiresIn,
	maxUses,
	usedCount,
	userEmail,
	token,
	isLoggedIn,
	isError,
	errorTitle,
	errorDescription,
}: AnimatedInvitationCardProps) {
	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
				ease: "easeOut",
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, x: -20 },
		visible: {
			opacity: 1,
			x: 0,
			transition: {
				duration: 0.5,
				ease: "easeOut",
			},
		},
	};

	if (isError) {
		return (
			<motion.div
				className="container max-w-lg mx-auto"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
			>
				<Card className="backdrop-blur-sm bg-card/95 shadow-lg border-muted">
					<CardHeader className="space-y-2">
						<Badge variant="destructive" className="mb-2">
							エラー
						</Badge>
						<CardTitle className="text-2xl sm:text-3xl font-bold text-destructive">
							{errorTitle}
						</CardTitle>
						<CardDescription className="text-base">
							{errorDescription}
						</CardDescription>
					</CardHeader>
				</Card>
			</motion.div>
		);
	}

	return (
		<motion.div
			className="container max-w-lg mx-auto"
			initial="hidden"
			animate="visible"
			variants={containerVariants}
		>
			<Card className="backdrop-blur-sm bg-card/95 shadow-lg border-muted">
				<CardHeader className="space-y-2">
					<motion.div variants={itemVariants}>
						<Badge variant="secondary" className="mb-2">
							招待状
						</Badge>
						<CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
							香典帳への招待
						</CardTitle>
					</motion.div>
					{userEmail && (
						<motion.div variants={itemVariants}>
							<CardDescription className="text-sm">
								ログイン中のユーザー: {userEmail}
							</CardDescription>
						</motion.div>
					)}
				</CardHeader>
				<CardContent className="space-y-6">
					<motion.div
						variants={itemVariants}
						className="rounded-lg bg-muted/50 p-4 backdrop-blur-sm"
					>
						<h3 className="font-semibold flex items-center gap-2 text-lg mb-2">
							<Info className="h-5 w-5" />
							香典帳情報
						</h3>
						<p className="text-lg font-medium">{title}</p>
						{description && (
							<p className="text-sm text-muted-foreground mt-2">
								{description}
							</p>
						)}
					</motion.div>

					<Separator />

					<motion.div variants={itemVariants} className="space-y-4">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">招待者</p>
								<p className="font-medium">{creatorName}</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<CalendarDays className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">有効期限</p>
								<p className="font-medium">{expiresIn}</p>
								{maxUses && (
									<p className="text-sm text-muted-foreground mt-1">
										残り利用回数:{" "}
										<span className="font-medium">
											{maxUses - (usedCount ?? 0)}回
										</span>
									</p>
								)}
							</div>
						</div>
					</motion.div>
				</CardContent>
				<CardFooter className="flex flex-col gap-4 pt-2">
					<motion.div
						variants={itemVariants}
						className="w-full"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						{isLoggedIn ? (
							<AcceptInvitationButton token={token} />
						) : (
							<>
								<p className="text-sm text-center text-muted-foreground mb-3">
									招待を受け入れるにはログインが必要です
								</p>
								<LoginButton invitationToken={token} />
							</>
						)}
					</motion.div>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
