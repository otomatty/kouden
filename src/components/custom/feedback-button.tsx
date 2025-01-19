"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function FeedbackButton() {
	return (
		<div className="fixed bottom-8 right-8 hidden md:block">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Link href="/feedback">
							<Button
								size="lg"
								className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground"
							>
								<MessageSquarePlus className="h-5 w-5" />
								<span className="ml-2">フィードバック</span>
							</Button>
						</Link>
					</TooltipTrigger>
					<TooltipContent>
						<p>ご意見・ご要望をお聞かせください</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
