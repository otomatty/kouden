"use client";

import { useEffect } from "react";
import { useInitializeGuideMode } from "@/hooks/use-guide-mode";

interface InitializeGuideModeProps {
	children: React.ReactNode;
	initialValue: boolean;
}

export function InitializeGuideMode({
	children,
	initialValue,
}: InitializeGuideModeProps) {
	const setGuideMode = useInitializeGuideMode();

	useEffect(() => {
		setGuideMode(initialValue);
	}, [initialValue, setGuideMode]);

	return <>{children}</>;
}
