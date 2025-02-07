"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FeedbackForm } from "@/components/custom/feedback-form";
import { ResponsiveDialog } from "@/components/custom/responsive-dialog";

export function FeedbackButton() {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const trigger = isDesktop ? (
		<Button
			size="lg"
			className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground"
		>
			<MessageSquarePlus className="h-5 w-5" />
			<span className="ml-2">不具合・ご要望はこちら</span>
		</Button>
	) : (
		<Button className="justify-start">
			<MessageSquarePlus className="h-5 w-5" />
			<span className="text-sm font-medium">不具合・ご要望はこちら</span>
		</Button>
	);

	return (
		<ResponsiveDialog trigger={trigger} title="不具合・ご要望はこちら" className="p-4">
			<FeedbackForm />
		</ResponsiveDialog>
	);
}
