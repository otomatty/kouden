"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { guideModeAtom } from "@/store/guide";
import { useAtomValue } from "jotai";

interface GuideCardProps {
	children: React.ReactNode;
	content: React.ReactNode;
	align?: "start" | "center" | "end";
	sideOffset?: number;
}

export function GuideCard({ children, content, align, sideOffset }: GuideCardProps) {
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
