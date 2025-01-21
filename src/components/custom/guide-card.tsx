"use client";

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useGuideMode } from "@/hooks/use-guide-mode";

interface GuideCardProps {
	children: React.ReactNode;
	content: React.ReactNode;
	align?: "start" | "center" | "end";
	sideOffset?: number;
}

export function GuideCard({
	children,
	content,
	align,
	sideOffset,
}: GuideCardProps) {
	const { isEnabled } = useGuideMode();

	if (!isEnabled) {
		return <>{children}</>;
	}

	return (
		<HoverCard>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>
			<HoverCardContent align={align} sideOffset={sideOffset}>
				{content}
			</HoverCardContent>
		</HoverCard>
	);
}
