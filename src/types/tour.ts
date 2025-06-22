import type { Driver, DriveStep } from "driver.js";

export type DriverRef = Driver | null;

export type Step = DriveStep & {
	/** Device-specific filtering for tour steps */
	advanceOn?: { selector: string; event: string };
	media?: "desktop" | "mobile";
};

export interface TourState {
	isActive: boolean;
	currentPage: string;
}

export interface TourStepConfig {
	[key: string]: Step[];
}
