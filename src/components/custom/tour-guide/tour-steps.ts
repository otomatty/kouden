import type { Step, TourStepConfig } from "@/types/tour";
import { tourStepsConfig as config } from "@/tour-guide";

export const tourStepsConfig: TourStepConfig = config;

export const getTourSteps = (pathname: string): Step[] => {
	// 完全一致を最初に試す
	if (tourStepsConfig[pathname]) {
		return tourStepsConfig[pathname];
	}

	// パスからIDを除去して一致するパターンを探す
	const normalizedPath = pathname.replace(/\/[^/]+$/, "/[id]");
	if (tourStepsConfig[normalizedPath]) {
		return tourStepsConfig[normalizedPath];
	}

	// /koudens/[id]/entries のようなパターンもチェック
	const entriesPattern = pathname.replace(/\/[^/]+\/entries$/, "/[id]/entries");
	if (tourStepsConfig[entriesPattern]) {
		return tourStepsConfig[entriesPattern];
	}

	return [];
};
