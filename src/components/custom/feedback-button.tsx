"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import AppContactForm from "@/components/contact/app-contact-form";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import type { User } from "@supabase/supabase-js";
import { useState } from "react";

interface FeedbackButtonProps {
	user: User;
}

export function FeedbackButton({ user }: FeedbackButtonProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const [isOpen, setIsOpen] = useState(false);

	const trigger = isDesktop ? (
		<Button
			size="lg"
			className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground"
		>
			<MessageSquarePlus className="h-5 w-5" />
			<span>不具合・ご要望はこちら</span>
		</Button>
	) : (
		<Button className="justify-start">
			<MessageSquarePlus className="h-5 w-5" />
			<span className="text-sm font-medium">不具合・ご要望</span>
		</Button>
	);

	const handleSuccess = () => {
		setIsOpen(false);
	};

	return (
		<FeedbackDialog
			trigger={trigger}
			title="不具合・ご要望はこちら"
			open={isOpen}
			onOpenChange={setIsOpen}
		>
			<AppContactForm user={user} onSuccess={handleSuccess} />
		</FeedbackDialog>
	);
}
