"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { tourStateAtom } from "./tour-store";

export function WelcomeTourInitializer() {
	const pathname = usePathname();
	const [tourState, setTourState] = useAtom(tourStateAtom);

	useEffect(() => {
		// 初回 /koudens 訪問時のみウェルカムツアーを起動
		if (!tourState.isActive && pathname === "/koudens") {
			const hasShown = localStorage.getItem("welcomeTourShown");
			if (!hasShown) {
				setTourState({ isActive: true, currentPage: "/koudens" });
			}
		}
	}, [pathname, tourState.isActive, setTourState]);

	// ツアー完了（非アクティブ化）時に表示済みフラグをローカルストレージに保存
	useEffect(() => {
		if (!tourState.isActive && tourState.currentPage === "/koudens") {
			const hasShown = localStorage.getItem("welcomeTourShown");
			if (!hasShown) {
				localStorage.setItem("welcomeTourShown", "true");
			}
		}
	}, [tourState.isActive, tourState.currentPage]);

	return null;
}
