import type { TourStepConfig } from "@/types/tour";
import { koudensTourSteps } from "./koudens";
import { koudensEntriesTourSteps } from "./koudens/entries";

export const tourStepsConfig: TourStepConfig = {
	"/koudens": koudensTourSteps,
	"/koudens/[id]/entries": koudensEntriesTourSteps,
};
