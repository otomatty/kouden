import type { Step, TourStepConfig } from "@/types/tour";
import { tourStepsConfig as config } from "@/tour-guide";

export const tourStepsConfig: TourStepConfig = config;

export const getTourSteps = (pathname: string): Step[] => {
	// 基本パターンマッチでステップを取得
	let rawSteps: Step[] = [];
	if (tourStepsConfig[pathname]) {
		rawSteps = tourStepsConfig[pathname];
	} else {
		const normalizedPath = pathname.replace(/\/[^/]+$/, "/[id]");
		if (tourStepsConfig[normalizedPath]) {
			rawSteps = tourStepsConfig[normalizedPath];
		} else {
			const entriesPattern = pathname.replace(/\/[^/]+\/entries$/, "/[id]/entries");
			if (tourStepsConfig[entriesPattern]) {
				rawSteps = tourStepsConfig[entriesPattern];
			}
		}
	}
	// デバイス判定
	const isMobile = window.matchMedia("(max-width: 767px)").matches;
	// media プロパティでフィルタリング
	return rawSteps.filter(
		(step) => !step.media || (isMobile ? step.media === "mobile" : step.media === "desktop"),
	);
};
