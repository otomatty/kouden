"use client";

import { guideModeAtom } from "@/store/guide";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

interface InitializeGuideModeProps {
	children: React.ReactNode;
	initialValue: boolean;
}

export function InitializeGuideMode({ children, initialValue }: InitializeGuideModeProps) {
	const setGuideMode = useSetAtom(guideModeAtom);

	useEffect(() => {
		setGuideMode(initialValue);
	}, [initialValue, setGuideMode]);

	return <>{children}</>;
}
