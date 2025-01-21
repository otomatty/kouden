"use client";

import { atom, useAtom, useSetAtom } from "jotai";

const guideModeAtom = atom<boolean | null>(null);

export function useGuideMode() {
	const [isEnabled, setIsEnabled] = useAtom(guideModeAtom);

	return {
		// nullの場合はデフォルト値としてtrueを返す
		isEnabled: isEnabled ?? true,
		setIsEnabled,
	};
}

export function useInitializeGuideMode() {
	return useSetAtom(guideModeAtom);
}
