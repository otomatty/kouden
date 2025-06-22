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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthForm } from "@/components/custom/auth-form";

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
	isExistingMember?: boolean;
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
	isExistingMember,
}: AnimatedInvitationCardProps) {
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
						<CardDescription className="text-base">{errorDescription}</CardDescription>
					</CardHeader>
				</Card>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8"
		>
			<Card className="w-full">
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
						{description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
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
										<span className="font-medium">{maxUses - (usedCount ?? 0)}回</span>
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
						{isError ? (
							<Button asChild variant="outline" className="w-full">
								<Link href="/">トップページに戻る</Link>
							</Button>
						) : isExistingMember ? (
							<>
								<p className="text-sm text-center text-muted-foreground mb-3">
									あなたはすでにこの香典帳のメンバーです
								</p>
								<Button asChild className="w-full">
									<Link href="/koudens">香典帳一覧を表示する</Link>
								</Button>
							</>
						) : isLoggedIn ? (
							<AcceptInvitationButton token={token} />
						) : (
							<AuthForm invitationToken={token} />
						)}
					</motion.div>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
