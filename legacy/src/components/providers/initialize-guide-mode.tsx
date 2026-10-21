"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { guideModeAtom } from "@/store/guide";

interface InitializeGuideModeProps {
	children: React.ReactNode;
	initialValue: boolean;
}

export function InitializeGuideMode({
	children,
	initialValue,
}: InitializeGuideModeProps) {
	const setGuideMode = useSetAtom(guideModeAtom);

	useEffect(() => {
		setGuideMode(initialValue);
	}, [initialValue, setGuideMode]);

	return <>{children}</>;
}
