"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { FeedbackForm } from "@/components/custom/feedback-form";

export function FeedbackButton() {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<Button variant="outline" size="sm" className="flex items-center gap-2">
				<MessageSquare className="h-4 w-4" />
				<span>フィードバック</span>
			</Button>
		);
	}

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<button
					type="button"
					className="flex flex-col items-center gap-1.5 min-w-[60px] py-2 px-2 text-primary hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
				>
					<MessageSquare className="h-5 w-5" />
					<span className="text-xs font-medium">報告</span>
				</button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>フィードバック</DrawerTitle>
				</DrawerHeader>
				<div className="p-4">
					<FeedbackForm />
				</div>
			</DrawerContent>
		</Drawer>
	);
}
