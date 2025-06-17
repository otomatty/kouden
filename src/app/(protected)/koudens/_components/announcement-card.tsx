"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	X,
	ExternalLink,
	Info,
	AlertTriangle,
	CheckCircle,
	Megaphone,
	AlertCircle,
} from "lucide-react";
import type { Announcement, AnnouncementType } from "@/types/announcements";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
	announcement: Announcement;
	onDismiss?: (id: string) => void;
	showDismissButton?: boolean;
}

export function AnnouncementCard({
	announcement,
	onDismiss,
	showDismissButton = false,
}: AnnouncementCardProps) {
	const getTypeConfig = (type: AnnouncementType) => {
		switch (type) {
			case "info":
				return {
					icon: Info,
					badge: "情報",
					variant: "default" as const,
					className: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
				};
			case "warning":
				return {
					icon: AlertTriangle,
					badge: "注意",
					variant: "destructive" as const,
					className: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
				};
			case "success":
				return {
					icon: CheckCircle,
					badge: "成功",
					variant: "secondary" as const,
					className: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
				};
			case "promotion":
				return {
					icon: Megaphone,
					badge: "お知らせ",
					variant: "default" as const,
					className: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
				};
			case "maintenance":
				return {
					icon: AlertCircle,
					badge: "メンテナンス",
					variant: "destructive" as const,
					className: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
				};
			default:
				return {
					icon: Info,
					badge: "情報",
					variant: "default" as const,
					className: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
				};
		}
	};

	const typeConfig = getTypeConfig(announcement.type);
	const IconComponent = typeConfig.icon;

	const handleDismiss = () => {
		if (onDismiss) {
			onDismiss(announcement.id);
		}
	};

	return (
		<Card className={cn("relative overflow-hidden", typeConfig.className)}>
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start gap-3">
					{/* アイコンとバッジ */}
					<div className="flex-shrink-0 pt-1">
						<IconComponent className="h-5 w-5 text-current" />
					</div>

					{/* メインコンテンツ */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2 mb-2">
							<div className="flex items-center gap-2 flex-wrap">
								<Badge variant={typeConfig.variant} className="text-xs">
									{typeConfig.badge}
								</Badge>
								<h3 className="font-semibold text-sm sm:text-base leading-tight">
									{announcement.title}
								</h3>
							</div>
							{showDismissButton && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDismiss}
									className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
									aria-label="お知らせを閉じる"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>

						<p className="text-sm text-muted-foreground mb-3 leading-relaxed">
							{announcement.description}
						</p>

						{/* 画像 */}
						{announcement.image_url && (
							<div className="mb-3 rounded-md overflow-hidden">
								<Image
									src={announcement.image_url}
									alt={announcement.title}
									width={400}
									height={200}
									className="w-full h-auto object-cover"
								/>
							</div>
						)}

						{/* CTAボタン */}
						{announcement.cta_label && announcement.cta_link && (
							<div className="flex items-center gap-2">
								<Button asChild size="sm" variant="outline">
									<Link href={announcement.cta_link} className="flex items-center gap-1">
										{announcement.cta_label}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
