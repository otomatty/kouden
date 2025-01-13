import type { DriveStep, Driver, DriverHook } from "driver.js";

export interface TourStep extends DriveStep {
	element: string;
	popover: {
		title: string;
		description: string;
		position?: "top" | "bottom" | "left" | "right" | "auto";
		onNextClick?: DriverHook;
	};
}

export interface TourState {
	isActive: boolean;
	isCompleted: boolean;
}

export type DriverRef = Driver | null;
