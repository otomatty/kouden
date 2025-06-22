import type { Driver, DriveStep } from "driver.js";

export type DriverRef = Driver | null;

export type Step = DriveStep & { advanceOn?: { selector: string; event: string } };

export interface TourState {
	isActive: boolean;
	currentPage: string;
}

export interface TourStepConfig {
	[key: string]: Step[];
}
