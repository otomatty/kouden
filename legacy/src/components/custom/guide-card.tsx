"use client";

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useAtomValue } from "jotai";
import { guideModeAtom } from "@/store/guide";

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
	const isEnabled = useAtomValue(guideModeAtom);

	// nullの場合はデフォルト値としてtrueを返す
	if (isEnabled === null || !isEnabled) {
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
